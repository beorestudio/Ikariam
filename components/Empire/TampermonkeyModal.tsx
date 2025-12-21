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
// @name         Ikariam Empire Connector v4.9 (Deep Scan)
// @namespace    http://tampermonkey.net/
// @version      4.9
// @description  Extração profunda de dados ignorando cidades ocupadas e contornando bloqueios de AJAX.
// @author       Ikariam Booster
// @match        https://*.ikariam.gameforge.com/*
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const APP_URL = "${appUrl}";
    const STORAGE_KEY = 'ikariam_booster_empire_storage_v49';
    const SYNC_BUTTON_ID = 'ikariam-booster-sync-btn';
    const SCAN_BUTTON_ID = 'ikariam-booster-scan-btn';

    const RESOURCE_MAP = {
        'resource': 'Madeira', '1': 'Vinho', 'wine': 'Vinho',
        '2': 'Mármore', 'marble': 'Mármore', '3': 'Cristal', 'glass': 'Cristal',
        '4': 'Enxofre', 'sulfur': 'Enxofre'
    };

    const BUILDING_MAP = {
        'townHall': 'town_hall', 'academy': 'academy', 'warehouse': 'warehouse',
        'tavern': 'tavern', 'palace': 'palace', 'palaceColony': 'governor_residence',
        'museum': 'museum', 'port': 'trading_port', 'shipyard': 'shipyard',
        'barracks': 'barracks', 'wall': 'town_wall', 'embassy': 'embassy',
        'branchOffice': 'market', 'workshop': 'workshop', 'safehouse': 'hideout',
        'forester': 'forester', 'glassblower': 'glassblower', 'alchemist': 'alchemist',
        'winegrower': 'wine_grower', 'stonemason': 'stonemason', 'carpentering': 'carpenter',
        'optician': 'optician', 'fireworker': 'firework', 'vineyard': 'wine_cellar',
        'architect': 'architect', 'temple': 'temple', 'pirateFortress': 'pirate_fortress',
        'blackMarket': 'black_market', 'marineChartArchive': 'sea_chart_archive',
        'shrineOfOlympus': 'shrine', 'dump': 'dump'
    };

    function getStoredEmpire() {
        try {
            const data = GM_getValue(STORAGE_KEY, "{}");
            return JSON.parse(data);
        } catch (e) { return {}; }
    }

    function saveEmpire(data) {
        GM_setValue(STORAGE_KEY, JSON.stringify(data));
        updateButtonsUI();
    }

    function extractData(dataSet, htmlText, empireStore, cityId) {
        const model = unsafeWindow.ikariam.model;
        const cityList = model.relatedCityData;
        const cityInfo = cityList['city_' + cityId] || Object.values(cityList).find(c => c.id == cityId);
        
        // FILTRO CRÍTICO: Se não for cidade própria, ignora completamente
        if (cityInfo && cityInfo.relationship !== 'ownCity') {
            console.log("Ikariam Booster: Pulando cidade não-própria (ocupada ou estrangeira): " + cityInfo.name);
            return empireStore;
        }

        const cityName = cityInfo ? cityInfo.name : (dataSet.backgroundView ? dataSet.backgroundView.name : "Cidade " + cityId);
        const coords = cityInfo ? cityInfo.coords : "[?:?]";

        const resources = {};
        const setRes = (id, keyName, prodVal) => {
            const name = RESOURCE_MAP[id];
            if(!name) return;
            resources[name] = {
                resourceType: name,
                currentAmount: Math.floor(dataSet.currentResources[keyName] || 0),
                maxCapacity: Math.floor(dataSet.maxResources[keyName] || 0),
                production: Math.floor(prodVal || 0),
                isFull: (dataSet.currentResources[keyName] >= dataSet.maxResources[keyName])
            };
        };

        const woodProd = (dataSet.resourceProduction || 0) * 3600; 
        const luxuryType = dataSet.producedTradegood; 
        const luxuryProd = (dataSet.tradegoodProduction || 0) * 3600;

        setRes('resource', 'resource', woodProd);
        if (luxuryType) setRes(luxuryType, luxuryType, luxuryProd);
        
        ['1','2','3','4'].forEach(k => { 
            const name = RESOURCE_MAP[k];
            if (name && !resources[name]) {
                resources[name] = {
                    resourceType: name,
                    currentAmount: Math.floor(dataSet.currentResources[k] || 0),
                    maxCapacity: Math.floor(dataSet.maxResources[k] || 0),
                    production: 0,
                    isFull: (dataSet.currentResources[k] >= dataSet.maxResources[k])
                };
            }
        });

        let buildings = [];
        let constructionQueue = [];
        
        if (htmlText) {
             const buildingRegex = /<li\\s+id="position(\\d+)"\\s+class="([^"]*?building[^"]*?)"/g;
             let bMatch;
             while ((bMatch = buildingRegex.exec(htmlText)) !== null) {
                const classes = bMatch[2];
                const typeMatch = classes.match(/^(\\w+)\\s/);
                const levelMatch = classes.match(/level(\\d+)/);
                if (typeMatch && levelMatch) {
                    const rawType = typeMatch[1];
                    const type = BUILDING_MAP[rawType] || rawType;
                    if (rawType !== 'buildingGround' && rawType !== 'constructionSite') {
                        buildings.push({ buildingId: type, level: parseInt(levelMatch[1]), name: rawType, position: bMatch[1] });
                    }
                }
             }

             const timerRegex = /"endUpgrade"\\s*:\\s*(\\d+)/g;
             let tMatch;
             while ((tMatch = timerRegex.exec(htmlText)) !== null) {
                const endTime = parseInt(tMatch[1]) * 1000;
                if (endTime > Date.now()) {
                    const context = htmlText.substring(Math.max(0, tMatch.index - 600), tMatch.index);
                    const typeMatch = context.match(/class="building\\s+(\\w+)/);
                    if (typeMatch) {
                        const rawType = typeMatch[1];
                        const type = BUILDING_MAP[rawType] || rawType;
                        const levelMatch = context.match(/level(\\d+)/) || context.match(/"level"\\s*:\\s*(\\d+)/);
                        const nextLevel = levelMatch ? parseInt(levelMatch[1]) + 1 : 1;
                        constructionQueue.push({ buildingId: type, name: rawType, level: nextLevel, startTime: Date.now(), endTime: endTime });
                    }
                }
             }
        }

        empireStore[cityId] = {
            id: parseInt(cityId),
            name: cityName,
            coords: coords,
            islandId: dataSet.viewParams ? dataSet.viewParams.islandId : 0,
            resources: resources,
            buildings: buildings.length > 0 ? buildings : (empireStore[cityId]?.buildings || []),
            constructionQueue: constructionQueue,
            updatedAt: Date.now()
        };

        return empireStore;
    }

    async function scanAllCities() {
        const btn = document.getElementById(SCAN_BUTTON_ID);
        if(btn) {
            btn.disabled = true;
            btn.style.backgroundColor = '#444';
        }

        try {
            const model = unsafeWindow.ikariam.model;
            if (!model || !model.relatedCityData) {
                alert("O jogo ainda não carregou totalmente. Aguarde a página terminar de carregar.");
                return;
            }

            const myCities = Object.values(model.relatedCityData)
                .filter(c => c.relationship === 'ownCity')
                .map(c => c.id);

            console.log("Ikariam Booster: Iniciando scan de " + myCities.length + " cidades próprias.");
            
            let empire = {}; 
            let successCount = 0;

            for (const cityId of myCities) {
                if(btn) btn.innerHTML = '⏳ ' + (successCount + 1) + '/' + myCities.length;
                
                try {
                    await new Promise(r => setTimeout(r, 1200));
                    const response = await fetch('/index.php?view=city&cityId=' + cityId + '&backgroundView=city');
                    const htmlText = await response.text();
                    
                    // Regex flexível: procura qualquer objeto JSON atribuído a dataSetForView
                    const match = htmlText.match(/window\\.dataSetForView\\s*=\\s*({.+?});/s);

                    if (match && match[1]) {
                        const ds = JSON.parse(match[1]);
                        empire = extractData(ds, htmlText, empire, cityId);
                        successCount++;
                    } else {
                        console.warn("Falha ao extrair JSON da cidade " + cityId + ". Tentando via modelo global...");
                        // Backup: Tenta usar o modelo atual se estiver na visualização correta
                        if (model.cityId == cityId && unsafeWindow.dataSetForView) {
                            empire = extractData(unsafeWindow.dataSetForView, htmlText, empire, cityId);
                            successCount++;
                        }
                    }
                } catch (err) { console.error("Erro na cidade " + cityId, err); }
            }

            if (successCount > 0) {
                saveEmpire(empire);
                if(btn) btn.innerHTML = '✅ ' + successCount + ' Cidades!';
            } else {
                if(btn) btn.innerHTML = '❌ Falha no Scan';
                alert("O script não conseguiu ler os dados. Tente atualizar a página e clicar em uma de suas cidades antes de escanear.");
            }

        } catch (e) {
            if(btn) btn.innerHTML = '❌ Erro';
        } finally {
            setTimeout(() => {
                if(btn) btn.disabled = false;
                updateButtonsUI();
            }, 3000);
        }
    }

    function sendData() {
        const empire = getStoredEmpire();
        const payload = Object.values(empire);
        if (payload.length === 0) { alert("Escaneie primeiro!"); return; }

        const btn = document.getElementById(SYNC_BUTTON_ID);
        if(btn) btn.innerHTML = '⏳ Abrindo App...';

        const targetWindow = window.open(APP_URL, 'ikariam_booster_target');
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (targetWindow) {
                targetWindow.postMessage({ type: 'IKARIAM_EMPIRE_DATA', payload: payload }, '*');
                if (attempts > 6) {
                    clearInterval(interval);
                    if(btn) btn.innerHTML = '✅ Sucesso!';
                    setTimeout(() => updateButtonsUI(), 2000);
                }
            } else {
                clearInterval(interval);
                alert("Habilite os Pop-ups do seu navegador!");
                updateButtonsUI();
            }
        }, 1000);
    }

    function updateButtonsUI() {
        const empire = getStoredEmpire();
        const count = Object.keys(empire).length;
        const btnSync = document.getElementById(SYNC_BUTTON_ID);
        if(btnSync) {
            btnSync.innerHTML = '⚡ Enviar para o App (' + count + ')';
            btnSync.style.opacity = count > 0 ? '1' : '0.6';
        }
        const btnScan = document.getElementById(SCAN_BUTTON_ID);
        if(btnScan) btnScan.innerHTML = '🔄 Escanear Império';
    }

    function createUI() {
        if (document.getElementById(SYNC_BUTTON_ID)) return;
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;';

        const btnScan = document.createElement('button');
        btnScan.id = SCAN_BUTTON_ID;
        btnScan.onclick = scanAllCities;
        styleBtn(btnScan, '#2563EB'); 

        const btnSync = document.createElement('button');
        btnSync.id = SYNC_BUTTON_ID;
        btnSync.onclick = sendData;
        styleBtn(btnSync, '#8B4513');

        container.appendChild(btnScan);
        container.appendChild(btnSync);
        document.body.appendChild(container);
        updateButtonsUI();
    }

    function styleBtn(btn, color) {
        btn.style.cssText = 'padding:14px 24px;background-color:'+color+';color:#FFF;border:2px solid rgba(255,255,255,0.4);border-radius:14px;cursor:pointer;font-weight:bold;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,0.3);transition:all 0.2s;text-align:center;min-width:230px;font-family:sans-serif;';
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
    }

    setTimeout(createUI, 4000);
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
          <div className="bg-blue-900 px-4 py-3 flex justify-between items-center text-white">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Download className="w-5 h-5" /> Instalar Script v4.9 (Deep Scan)
            </h3>
            <button onClick={onClose} className="text-blue-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                <Check className="w-4 h-4" /> Por que falhava e como corrigimos:
              </h4>
              <ul className="text-sm text-blue-800 space-y-2 list-disc ml-5">
                <li><strong>Bloqueio de AJAX:</strong> O jogo as vezes oculta os dados em requisições de fundo. O novo <strong>Deep Scan</strong> utiliza a memória global do jogo como backup.</li>
                <li><strong>Conflito de Cidades:</strong> Agora o script ignora qualquer cidade marcada como <em>"Ocupada"</em> ou <em>"Estrangeira"</em> no menu do jogo, focando apenas nas suas colônias.</li>
                <li><strong>Sincronização:</strong> O delay foi ajustado para 1.2s para garantir estabilidade em conexões lentas.</li>
              </ul>
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