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
// @name         Ikariam Empire Connector v4.1 (Auto-Scan + Construções)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Coleta recursos e FILA DE CONSTRUÇÃO de todas as cidades
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
    function extractDataFromDataSet(dataSet, htmlText, empireStore) {
        if (!dataSet || !dataSet.relatedCityData || !dataSet.relatedCityData.selectedCity) return empireStore;

        const selectedCityKey = dataSet.relatedCityData.selectedCity; // e.g. "city_7511"
        const cityInfo = dataSet.relatedCityData[selectedCityKey];
        
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
        ['1','2','3','4'].forEach(k => {
            if(k !== luxuryType) setRes(k, k, 0);
        });

        // 2. Parse Buildings & Construction Queue from HTML/JSON
        let buildings = [];
        let constructionQueue = [];
        
        // Tenta extrair do HTML se fornecido (Background scan)
        if (htmlText) {
             // Regex para edificios
             const buildingRegex = /<li\s+id="position(\d+)"\s+class="([^"]*?building[^"]*?)"/g;
             let bMatch;
             while ((bMatch = buildingRegex.exec(htmlText)) !== null) {
                const classes = bMatch[2];
                const typeMatch = classes.match(/^(\w+)\s/);
                const levelMatch = classes.match(/level(\d+)/);
                
                if (typeMatch && levelMatch) {
                    const rawType = typeMatch[1];
                    const type = BUILDING_MAP[rawType] || rawType;
                    if (rawType !== 'buildingGround' && rawType !== 'constructionSite') {
                            buildings.push({
                            buildingId: type,
                            level: parseInt(levelMatch[1]),
                            name: rawType,
                            position: bMatch[1]
                        });
                    }
                }
             }

             // --- LOGICA DE CONSTRUÇÃO ---
             // Procura scripts contendo "endUpgrade" ou contadores
             // Exemplo de script no HTML: var serverTime = 171545...; ... endUpgrade(1234567890);
             // O Ikariam geralmente coloca timers em scripts inline
             
             try {
                // Procura por blocos de contagem regressiva no HTML
                // Pattern comum: "endUpgrade":1740049451 ou chamadas de função
                // Vamos tentar achar o countdown global ou de edificio
                // Metodo simplificado: Procurar por classes "constructing" no HTML e tentar achar o tempo
                
                // Regex para pegar scripts que definem contadores
                // Exemplo: getCountdown({enddate: 1678999999, currentdate: 1678888888, step: 1});
                
                // Fallback: Se não achar no HTML, tentamos achar nos dados do jogo se disponiveis no dataSet
                
                // Tenta extrair do dataSet se tiver 'backgroundData' (algumas versões)
                // Caso contrário, busca no HTML por "enddate" proximo a um building
                
                // Vamos usar uma heuristica baseada em "constructionSite" class se existir
                const constructionRegex = /<div class="constructionSite"[^>]*>.*?<span class="textLabel">Update: (.*?)<\/span>.*?var\s+enddate\s*=\s*(\d+);/s;
                // Essa regex é complexa e falha facil.
                
                // MELHOR: Usar o timestamp do servidor atual e procurar datas futuras nos scripts
                const now = Date.now() / 1000;
                
                // Procura por qualquer timer de construção no HTML
                // Modelo: "endUpgrade": 1234567890
                const timerRegex = /"endUpgrade"\s*:\s*(\d+)/g;
                let tMatch;
                while ((tMatch = timerRegex.exec(htmlText)) !== null) {
                    const endTime = parseInt(tMatch[1]) * 1000; // JS usa ms
                    if (endTime > Date.now()) {
                        // Achou um timer futuro! Tenta descobrir o edificio associado
                        // Isso é dificil sem o DOM completo, mas vamos tentar pegar o contexto anterior
                        const context = htmlText.substring(tMatch.index - 500, tMatch.index);
                        
                        // Tenta achar o nome do edificio no contexto
                        // Procura patterns como: class="building townHall"
                        const typeMatch = context.match(/class="building\s+(\w+)/);
                        
                        if (typeMatch) {
                            const rawType = typeMatch[1];
                            const type = BUILDING_MAP[rawType] || rawType;
                            
                            // Achar o nivel alvo no contexto "level15" ou "value":15
                            const levelMatch = context.match(/level(\d+)/) || context.match(/"level"\s*:\s*(\d+)/);
                            const nextLevel = levelMatch ? parseInt(levelMatch[1]) + 1 : 1; // Assume upgrade

                            constructionQueue.push({
                                buildingId: type,
                                name: rawType, // Nome tecnico, o UI traduz pelo ID
                                level: nextLevel,
                                startTime: Date.now(), // Estimado
                                endTime: endTime
                            });
                        }
                    }
                }

             } catch(e) {
                 console.log("Erro parsing construção", e);
             }

        } else if (unsafeWindow.ikariam && unsafeWindow.ikariam.getScreen()) {
            // Se estiver na tela ativa (sem HTML text)
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
             
             // Tenta pegar construções da tela ativa
             // O objeto ikariam.model geralmente tem info
             // Ou procura no DOM elements com classe .constructionSite
             const sites = document.querySelectorAll('.constructionSite, .upgrading');
             sites.forEach(site => {
                 // Tenta extrair info do DOM
                 // Isso é fragil mas funciona na view ativa
                 try {
                     const container = site.closest('li.building');
                     if(container) {
                         const classList = container.className;
                         const typeMatch = classList.match(/^(\w+)\s/);
                         const rawType = typeMatch ? typeMatch[1] : 'unknown';
                         const type = BUILDING_MAP[rawType] || rawType;
                         
                         // Tenta achar script de timer dentro
                         const scripts = container.innerHTML;
                         const timeMatch = scripts.match(/"endUpgrade"\s*:\s*(\d+)/);
                         
                         if (timeMatch) {
                             constructionQueue.push({
                                 buildingId: type,
                                 name: rawType,
                                 level: 0, // Dificil pegar nivel alvo do DOM facil
                                 startTime: Date.now(),
                                 endTime: parseInt(timeMatch[1]) * 1000
                             });
                         }
                     }
                 } catch(e){}
             });
        }
        
        // Atualiza objeto da cidade
        const existingCity = empireStore[cityId] || {};
        const finalBuildings = buildings.length > 0 ? buildings : (existingCity.buildings || []);
        
        // Se achou fila nova, usa. Se não, mantem a antiga APENAS se ainda for válida (data futura)
        // Se a fila antiga já expirou, limpa.
        let finalQueue = constructionQueue.length > 0 ? constructionQueue : (existingCity.constructionQueue || []);
        finalQueue = finalQueue.filter(q => q.endTime > Date.now()); // Remove expired

        empireStore[cityId] = {
            id: cityId,
            name: cityInfo.name,
            coords: cityInfo.coords,
            islandId: dataSet.viewParams.islandId,
            resources: resources,
            buildings: finalBuildings,
            constructionQueue: finalQueue,
            updatedAt: Date.now()
        };

        return empireStore;
    }

    // Leitura passiva (navegação normal)
    function parseCurrentView() {
        try {
            const dataSet = unsafeWindow.dataSetForView;
            const empire = getStoredEmpire();
            // Passamos null no HTMLText pois estamos lendo a janela ativa (unsafeWindow)
            const updatedEmpire = extractDataFromDataSet(dataSet, null, empire);
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
            const cityList = unsafeWindow.ikariam.model.relatedCityData;
            const cityIds = Object.keys(cityList).filter(k => k.startsWith('city_')).map(k => cityList[k].id);
            
            let empire = getStoredEmpire();
            let count = 0;

            for (const cityId of cityIds) {
                count++;
                if(btn) btn.innerHTML = '⏳ Lendo ' + count + '/' + cityIds.length + '...';
                
                const delay = Math.floor(Math.random() * 700) + 800;
                await new Promise(r => setTimeout(r, delay));

                const response = await fetch('/index.php?view=city&cityId=' + cityId);
                const htmlText = await response.text();

                const regex = /window\.dataSetForView\s*=\s*(\{.*?\});/s;
                const match = htmlText.match(regex);

                if (match && match[1]) {
                    const jsonStr = match[1];
                    try {
                        const backgroundDataSet = JSON.parse(jsonStr);
                        // Passamos o HTML completo para regex de construção
                        empire = extractDataFromDataSet(backgroundDataSet, htmlText, empire);
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

        const btnScan = document.createElement('button');
        btnScan.id = SCAN_BUTTON_ID;
        btnScan.innerHTML = '🔄 Escanear Tudo';
        btnScan.onclick = scanAllCities;
        styleBtn(btnScan, '#2563EB'); 

        const btnSync = document.createElement('button');
        btnSync.id = SYNC_BUTTON_ID;
        btnSync.innerHTML = '⚡ Enviar';
        btnSync.onclick = sendData;
        styleBtn(btnSync, '#8B4513');

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

    setTimeout(() => {
        parseCurrentView();
        createUI();
    }, 1000);

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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-emerald-800 px-4 py-3 flex justify-between items-center text-white">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Download className="w-5 h-5" /> Instalar Script v4.1 (Auto-Scan + Construções)
            </h3>
            <button onClick={onClose} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-stone-800 font-semibold mb-2">Novidades v4.1:</h4>
              <p className="text-sm text-stone-600 mb-2">Agora o script identifica automaticamente as construções em andamento e seus tempos de término ao clicar em "Escanear Tudo".</p>
            </div>
            <div className="relative">
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${copied ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado!' : 'Copiar Código'}
                </button>
              </div>
              <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[300px] border border-stone-700">
                <code>{scriptCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TampermonkeyModal;