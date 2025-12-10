import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';

interface TampermonkeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TampermonkeyModal: React.FC<TampermonkeyModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const scriptCode = `// ==UserScript==
// @name         Ikariam Empire Connector v4 (Auto-Scan)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Coleta dados de todas as cidades automaticamente em background
// @author       Ikariam Booster
// @match        https://*.ikariam.gameforge.com/*
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const APP_URL = "${appUrl}";
    const STORAGE_KEY = 'ikariam_booster_empire_data';
    const SYNC_BUTTON_ID = 'ikariam-booster-sync-btn';
    const SCAN_BUTTON_ID = 'ikariam-booster-scan-btn';

    // --- Mapeamentos ---
    const RESOURCE_MAP = {
        'resource': 'Madeira',
        '1': 'Vinho', 'wine': 'Vinho',
        '2': 'Mármore', 'marble': 'Mármore',
        '3': 'Cristal', 'glass': 'Cristal',
        '4': 'Enxofre', 'sulfur': 'Enxofre'
    };

    const BUILDING_MAP = {
        'townHall': 'town_hall',
        'academy': 'academy',
        'warehouse': 'warehouse',
        'tavern': 'tavern',
        'palace': 'palace',
        'palaceColony': 'governor_residence',
        'museum': 'museum',
        'port': 'trading_port',
        'shipyard': 'shipyard',
        'barracks': 'barracks',
        'wall': 'town_wall',
        'embassy': 'embassy',
        'branchOffice': 'market',
        'workshop': 'workshop',
        'safehouse': 'hideout',
        'forester': 'forester',
        'glassblower': 'glassblower',
        'alchemist': 'alchemist',
        'winegrower': 'wine_grower',
        'stonemason': 'stonemason',
        'carpentering': 'carpenter',
        'optician': 'optician',
        'fireworker': 'firework',
        'vineyard': 'wine_cellar',
        'architect': 'architect',
        'temple': 'temple',
        'pirateFortress': 'pirate_fortress',
        'blackMarket': 'black_market',
        'marineChartArchive': 'sea_chart_archive',
        'shrineOfOlympus': 'shrine',
        'dump': 'dump'
    };

    // --- Core Logic ---

    function getStoredEmpire() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) { return {}; }
    }

    function saveEmpire(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        updateButtonsUI();
    }

    // Extrai dados de um objeto dataSet (seja da view atual ou de um fetch em background)
    function extractDataFromDataSet(dataSet, empireStore) {
        if (!dataSet || !dataSet.relatedCityData || !dataSet.relatedCityData.selectedCity) return empireStore;

        const selectedCityKey = dataSet.relatedCityData.selectedCity; // e.g. "city_7511"
        const cityInfo = dataSet.relatedCityData[selectedCityKey];
        
        // Se por algum motivo o cityInfo for nulo, tenta achar pelo ID direto nos breadcrumbs ou algo similar, 
        // mas geralmente relatedCityData tem tudo.
        if (!cityInfo) return empireStore;

        const cityId = cityInfo.id;

        // 1. Parse Resources
        const woodProd = (dataSet.resourceProduction || 0) * 3600; 
        const luxuryType = dataSet.producedTradegood; 
        const luxuryProd = (dataSet.tradegoodProduction || 0) * 3600;

        const resources = {};
        
        const setRes = (id, keyName, prodVal) => {
            const name = RESOURCE_MAP[id];
            if(!name) return;
            resources[name] = {
                resourceType: name,
                currentAmount: Math.floor(dataSet.currentResources[keyName] || 0),
                maxCapacity: Math.floor(dataSet.maxResources[keyName] || 0),
                production: Math.floor(prodVal),
                isFull: (dataSet.currentResources[keyName] >= dataSet.maxResources[keyName])
            };
        };

        setRes('resource', 'resource', woodProd);
        setRes(luxuryType, luxuryType, luxuryProd);
        // Zera produção dos outros
        ['1','2','3','4'].forEach(k => {
            if(k !== luxuryType) setRes(k, k, 0);
        });

        // 2. Parse Buildings
        // Precisamos verificar se estamos na visão da cidade ou se o dataSet tem dados de posição
        // No fetch background, dataSetForView costuma vir completo se a URL for view=city
        let buildings = [];
        
        // No background, não temos 'screen', temos que confiar no dataSet ou parsear HTML extra se necessário.
        // Felizmente, dataSetForView muitas vezes contém info, mas as vezes o jogo separa.
        // O método mais robusto é olhar para a variável 'backgroundData' se disponível, 
        // mas vamos tentar extrair do HTML se o dataset for insuficiente.
        // Nota: O dataSetForView NÃO contém a lista de edifícios diretamente em arrays simples na maioria das versões.
        // Ele depende do objeto 'ikariam.getScreen().data.position' que é construído pelo JS do jogo.
        // Porém, como estamos rodando o script, podemos tentar capturar do HTML bruto se necessário.
        
        // HACK: Se estivermos rodando na janela ativa, usamos o método normal:
        if (unsafeWindow.dataSetForView === dataSet && unsafeWindow.ikariam && unsafeWindow.ikariam.getScreen()) {
             const screen = unsafeWindow.ikariam.getScreen();
             if (screen.data && screen.data.position) {
                buildings = screen.data.position.map(pos => {
                    if (!pos.building) return null;
                    return {
                        buildingId: BUILDING_MAP[pos.building] || pos.building,
                        level: parseInt(pos.level),
                        name: pos.name,
                        position: pos.position
                    };
                }).filter(b => b !== null);
             }
        } 
        
        // Se estamos processando dados de background, 'unsafeWindow' não ajuda. 
        // O 'dataSet' passado aqui foi extraído via Regex do HTML.
        // Infelizmente, a lista de edifícios nem sempre está no dataSetForView JSON puro.
        // Ela costuma estar em outro script: "updateBackgroundData" ou no HTML direto.
        // Para simplificar a V4, vamos focar em garantir RECURSOS em background (o mais importante para logistica)
        // e manter edifícios se já existirem no cache, ou tentar um parse básico.
        
        // Atualiza objeto da cidade
        const existingCity = empireStore[cityId] || {};
        
        // Se não conseguimos ler edifícios (background), mantemos os antigos
        const finalBuildings = buildings.length > 0 ? buildings : (existingCity.buildings || []);

        empireStore[cityId] = {
            id: cityId,
            name: cityInfo.name,
            coords: cityInfo.coords,
            islandId: dataSet.viewParams.islandId,
            resources: resources,
            buildings: finalBuildings,
            updatedAt: Date.now()
        };

        return empireStore;
    }

    // Leitura passiva (navegação normal)
    function parseCurrentView() {
        try {
            const dataSet = unsafeWindow.dataSetForView;
            const empire = getStoredEmpire();
            const updatedEmpire = extractDataFromDataSet(dataSet, empire);
            saveEmpire(updatedEmpire);
        } catch (e) {
            console.error('Ikariam Booster: Erro ao ler dados passivos', e);
        }
    }

    // --- Background Scanning Logic ---

    async function scanAllCities() {
        const btn = document.getElementById(SCAN_BUTTON_ID);
        if(btn) btn.disabled = true;

        try {
            // Pega lista de cidades do modelo global
            const cityList = unsafeWindow.ikariam.model.relatedCityData;
            const cityIds = Object.keys(cityList).filter(k => k.startsWith('city_')).map(k => cityList[k].id);
            
            let empire = getStoredEmpire();
            let count = 0;

            for (const cityId of cityIds) {
                count++;
                if(btn) btn.innerHTML = '⏳ Lendo ' + count + '/' + cityIds.length + '...';
                
                // Delay aleatório para evitar detecção (800ms a 1500ms)
                const delay = Math.floor(Math.random() * 700) + 800;
                await new Promise(r => setTimeout(r, delay));

                // Fetch HTML da cidade
                const response = await fetch('/index.php?view=city&cityId=' + cityId);
                const htmlText = await response.text();

                // Extrair dataSetForView usando Regex
                const regex = /window\.dataSetForView\s*=\s*(\{.*?\});/s;
                const match = htmlText.match(regex);

                if (match && match[1]) {
                    const jsonStr = match[1];
                    try {
                        const backgroundDataSet = JSON.parse(jsonStr);
                        empire = extractDataFromDataSet(backgroundDataSet, empire);
                        
                        // Parse extra de edifícios via HTML (Regex simples nos tooltips ou areas)
                        // Procura patterns como: area title="Câmara Municipal Nível 25"
                        // Nota: Isso é um fallback básico.
                        // <li id="position1" class="townHall building matching_building level25 ...">
                        const buildingRegex = /<li\s+id="position(\d+)"\s+class="([^"]*?building[^"]*?)"/g;
                        let bMatch;
                        const backgroundBuildings = [];
                        
                        while ((bMatch = buildingRegex.exec(htmlText)) !== null) {
                            const pos = bMatch[1];
                            const classes = bMatch[2];
                            
                            // Extrair tipo e nível das classes
                            // Ex: "townHall building matching_building level25"
                            const typeMatch = classes.match(/^(\w+)\s/);
                            const levelMatch = classes.match(/level(\d+)/);
                            
                            if (typeMatch && levelMatch) {
                                const rawType = typeMatch[1];
                                const type = BUILDING_MAP[rawType] || rawType;
                                // Ignore 'buildingGround' (terreno vazio)
                                if (rawType !== 'buildingGround' && rawType !== 'constructionSite') {
                                     backgroundBuildings.push({
                                        buildingId: type,
                                        level: parseInt(levelMatch[1]),
                                        name: rawType, // Nome exato é dificil sem o title, usa o ID
                                        position: pos
                                    });
                                }
                            }
                        }
                        
                        if (backgroundBuildings.length > 0) {
                            empire[cityId].buildings = backgroundBuildings;
                        }

                    } catch (parseErr) {
                        console.error("Erro parsing JSON background", parseErr);
                    }
                }
            }

            saveEmpire(empire);
            if(btn) {
                btn.innerHTML = '✅ Concluído!';
                setTimeout(() => updateButtonsUI(), 2000);
            }

        } catch (e) {
            console.error('Erro no scan', e);
            if(btn) btn.innerHTML = '❌ Erro';
        } finally {
            if(btn) btn.disabled = false;
        }
    }

    function sendData() {
        const empire = getStoredEmpire();
        const payload = Object.values(empire);

        if (payload.length === 0) {
            alert("Nenhum dado. Navegue ou use o 'Escanear Império'.");
            return;
        }

        const targetWindow = window.open(APP_URL, 'ikariam_booster_target');
        if (targetWindow) {
            setTimeout(() => {
                targetWindow.postMessage({
                    type: 'IKARIAM_EMPIRE_DATA',
                    payload: payload
                }, '*');
                
                const btn = document.getElementById(SYNC_BUTTON_ID);
                if(btn) {
                    btn.innerHTML = '✅ Enviado!';
                    btn.style.backgroundColor = '#059669';
                    setTimeout(() => updateButtonsUI(), 2000);
                }
            }, 1500);
        } else {
            alert("Habilite popups para permitir a conexão.");
        }
    }

    function updateButtonsUI() {
        const empire = getStoredEmpire();
        const count = Object.keys(empire).length;
        
        const btnSync = document.getElementById(SYNC_BUTTON_ID);
        if(btnSync) {
            btnSync.innerHTML = '⚡ Enviar (' + count + ')';
            btnSync.style.backgroundColor = '#8B4513';
        }

        const btnScan = document.getElementById(SCAN_BUTTON_ID);
        if(btnScan) {
            btnScan.innerHTML = '🔄 Escanear Tudo';
        }
    }

    function createUI() {
        if (document.getElementById(SYNC_BUTTON_ID)) return;

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '15px';
        container.style.right = '15px';
        container.style.zIndex = '99999';
        container.style.display = 'flex';
        container.style.gap = '10px';

        // Botão de Scan
        const btnScan = document.createElement('button');
        btnScan.id = SCAN_BUTTON_ID;
        btnScan.innerHTML = '🔄 Escanear Tudo';
        btnScan.onclick = scanAllCities;
        styleBtn(btnScan, '#2563EB'); // Blue

        // Botão de Enviar
        const btnSync = document.createElement('button');
        btnSync.id = SYNC_BUTTON_ID;
        btnSync.innerHTML = '⚡ Enviar';
        btnSync.onclick = sendData;
        styleBtn(btnSync, '#8B4513'); // Brown

        container.appendChild(btnScan);
        container.appendChild(btnSync);
        document.body.appendChild(container);
        
        updateButtonsUI();
    }

    function styleBtn(btn, color) {
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = color;
        btn.style.color = '#FFF';
        btn.style.border = '2px solid rgba(255,255,255,0.2)';
        btn.style.borderRadius = '50px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '12px';
        btn.style.fontFamily = 'Arial, sans-serif';
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
        btn.style.transition = 'transform 0.1s';
    }

    // Inicialização
    setTimeout(() => {
        parseCurrentView();
        createUI();
    }, 1000);

    // Interceptor AJAX (mantido para navegação manual fluida)
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            setTimeout(parseCurrentView, 500); 
        });
        originalOpen.apply(this, arguments);
    };

})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-emerald-800 px-4 py-3 flex justify-between items-center text-white">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Download className="w-5 h-5" /> Instalar Script Tampermonkey v4 (Auto-Scan)
            </h3>
            <button onClick={onClose} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-stone-800 font-semibold mb-2">Instruções de Atualização v4.0:</h4>
              <ol className="list-decimal list-inside text-sm text-stone-600 space-y-2">
                <li>Abra o painel do <strong>Tampermonkey</strong> e edite o script antigo.</li>
                <li>Substitua <strong>todo</strong> o código pelo novo código abaixo (v4.0).</li>
                <li>Salve (Ctrl+S) e recarregue o Ikariam.</li>
                <li><strong>Novidade:</strong> Agora aparecerá um botão azul <strong>"🔄 Escanear Tudo"</strong>.</li>
                <li>Ao clicar nele, o script visitará silenciosamente todas as suas cidades em segundo plano para atualizar os dados de uma vez só!</li>
              </ol>
            </div>

            <div className="relative">
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado!' : 'Copiar Código'}
                </button>
              </div>
              <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[300px] border border-stone-700">
                <code>{scriptCode}</code>
              </pre>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 flex items-start gap-2">
              <span className="font-bold text-lg leading-none">i</span>
              <p>
                <strong>Nota sobre segurança:</strong> O modo "Escanear Tudo" adiciona um pequeno atraso aleatório entre cada cidade para simular um humano e evitar bloqueios do jogo. O processo pode levar alguns segundos.
              </p>
            </div>
          </div>

          <div className="bg-stone-50 px-4 py-3 sm:px-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-stone-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-stone-700 hover:bg-stone-50 focus:outline-none sm:text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TampermonkeyModal;