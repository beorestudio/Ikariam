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
// @name         Ikariam Empire Connector v4.2 (Fresh-Scan)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Coleta recursos e construções. Limpa dados antigos ao escanear tudo.
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

    function extractDataFromDataSet(dataSet, htmlText, empireStore) {
        if (!dataSet || !dataSet.relatedCityData || !dataSet.relatedCityData.selectedCity) return empireStore;

        const selectedCityKey = dataSet.relatedCityData.selectedCity;
        const cityInfo = dataSet.relatedCityData[selectedCityKey];
        if (!cityInfo) return empireStore;

        const cityId = cityInfo.id;
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
        ['1','2','3','4'].forEach(k => { if(k !== luxuryType) setRes(k, k, 0); });

        let buildings = [];
        let constructionQueue = [];
        
        if (htmlText) {
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
                        buildings.push({ buildingId: type, level: parseInt(levelMatch[1]), name: rawType, position: bMatch[1] });
                    }
                }
             }

             const timerRegex = /"endUpgrade"\s*:\s*(\d+)/g;
             let tMatch;
             while ((tMatch = timerRegex.exec(htmlText)) !== null) {
                const endTime = parseInt(tMatch[1]) * 1000;
                if (endTime > Date.now()) {
                    const context = htmlText.substring(tMatch.index - 500, tMatch.index);
                    const typeMatch = context.match(/class="building\s+(\w+)/);
                    if (typeMatch) {
                        const rawType = typeMatch[1];
                        const type = BUILDING_MAP[rawType] || rawType;
                        const levelMatch = context.match(/level(\d+)/) || context.match(/"level"\s*:\s*(\d+)/);
                        const nextLevel = levelMatch ? parseInt(levelMatch[1]) + 1 : 1;
                        constructionQueue.push({ buildingId: type, name: rawType, level: nextLevel, startTime: Date.now(), endTime: endTime });
                    }
                }
             }
        }

        const existingCity = empireStore[cityId] || {};
        const finalBuildings = buildings.length > 0 ? buildings : (existingCity.buildings || []);
        let finalQueue = constructionQueue.length > 0 ? constructionQueue : (existingCity.constructionQueue || []);
        finalQueue = finalQueue.filter(q => q.endTime > Date.now());

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

    async function scanAllCities() {
        const btn = document.getElementById(SCAN_BUTTON_ID);
        if(btn) btn.disabled = true;

        try {
            const cityList = unsafeWindow.ikariam.model.relatedCityData;
            const cityIds = Object.keys(cityList).filter(k => k.startsWith('city_')).map(k => cityList[k].id);
            
            // CRITICAL: Start with an empty object to wipe previous scans
            let empire = {}; 
            let count = 0;

            for (const cityId of cityIds) {
                count++;
                if(btn) btn.innerHTML = '⏳ ' + count + '/' + cityIds.length;
                
                await new Promise(r => setTimeout(r, 800));
                const response = await fetch('/index.php?view=city&cityId=' + cityId);
                const htmlText = await response.text();
                const regex = /window\.dataSetForView\s*=\s*(\{.*?\});/s;
                const match = htmlText.match(regex);

                if (match && match[1]) {
                    try {
                        const backgroundDataSet = JSON.parse(match[1]);
                        empire = extractDataFromDataSet(backgroundDataSet, htmlText, empire);
                    } catch (parseErr) {}
                }
            }

            saveEmpire(empire);
            if(btn) {
                btn.innerHTML = '✅ OK';
                setTimeout(() => updateButtonsUI(), 2000);
            }

        } catch (e) {
            if(btn) btn.innerHTML = '❌ Erro';
        } finally {
            if(btn) btn.disabled = false;
        }
    }

    function sendData() {
        const empire = getStoredEmpire();
        const payload = Object.values(empire);
        if (payload.length === 0) { alert("Use 'Escanear Tudo' primeiro."); return; }

        const targetWindow = window.open(APP_URL, 'ikariam_booster_target');
        if (targetWindow) {
            setTimeout(() => {
                targetWindow.postMessage({ type: 'IKARIAM_EMPIRE_DATA', payload: payload }, '*');
                const btn = document.getElementById(SYNC_BUTTON_ID);
                if(btn) {
                    btn.innerHTML = '✅ Enviado!';
                    setTimeout(() => updateButtonsUI(), 2000);
                }
            }, 1500);
        }
    }

    function updateButtonsUI() {
        const empire = getStoredEmpire();
        const count = Object.keys(empire).length;
        const btnSync = document.getElementById(SYNC_BUTTON_ID);
        if(btnSync) btnSync.innerHTML = '⚡ Enviar (' + count + ')';
        const btnScan = document.getElementById(SCAN_BUTTON_ID);
        if(btnScan) btnScan.innerHTML = '🔄 Escanear Tudo';
    }

    function createUI() {
        if (document.getElementById(SYNC_BUTTON_ID)) return;
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;bottom:15px;right:15px;z-index:99999;display:flex;gap:10px;';

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
        btn.style.cssText = 'padding:10px 18px;background-color:'+color+';color:#FFF;border:2px solid rgba(255,255,255,0.3);border-radius:50px;cursor:pointer;font-weight:bold;font-size:13px;box-shadow:0 4px 10px rgba(0,0,0,0.3);transition:transform 0.1s;';
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
    }

    setTimeout(createUI, 1000);
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
              <Download className="w-5 h-5" /> Instalar Script v4.2 (Limpeza de Dados)
            </h3>
            <button onClick={onClose} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-stone-800 font-semibold mb-2">Novidades v4.2:</h4>
              <p className="text-sm text-stone-600 mb-2">
                Agora, ao clicar em <strong>"Escanear Tudo"</strong>, o script limpa automaticamente quaisquer cidades antigas que não existem mais no seu império atual, enviando apenas dados frescos.
              </p>
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