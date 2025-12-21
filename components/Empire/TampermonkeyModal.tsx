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
// @name         Ikariam Empire Connector v4.5 (Fixed Sync)
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Coleta recursos e construções com armazenamento persistente e envio corrigido.
// @author       Ikariam Booster
// @match        https://*.ikariam.gameforge.com/*
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const APP_URL = "${appUrl}";
    const STORAGE_KEY = 'ikariam_booster_empire_storage';
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
            const data = GM_getValue(STORAGE_KEY, "{}");
            return JSON.parse(data);
        } catch (e) { return {}; }
    }

    function saveEmpire(data) {
        GM_setValue(STORAGE_KEY, JSON.stringify(data));
        updateButtonsUI();
    }

    function extractData(dataSet, htmlText, empireStore, cityId) {
        if (!dataSet || !dataSet.currentResources) return empireStore;

        // Tenta encontrar info da cidade na lista global se não estiver no dataset local
        const cityList = unsafeWindow.ikariam.model.relatedCityData;
        const cityInfo = cityList['city_' + cityId] || Object.values(cityList).find(c => c.id == cityId);
        
        if (!cityInfo) return empireStore;

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
        if (luxuryType) setRes(luxuryType, luxuryType, luxuryProd);
        
        // Zera produção dos outros recursos de luxo para evitar lixo de memória
        ['1','2','3','4'].forEach(k => { 
            if(k != luxuryType) {
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
            }
        });

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

        empireStore[cityId] = {
            id: cityId,
            name: cityInfo.name,
            coords: cityInfo.coords,
            islandId: dataSet.viewParams ? dataSet.viewParams.islandId : cityInfo.islandId,
            resources: resources,
            buildings: buildings.length > 0 ? buildings : (empireStore[cityId]?.buildings || []),
            constructionQueue: constructionQueue,
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
            
            let empire = {}; // Começa limpo para garantir dados frescos
            let count = 0;

            for (const cityId of cityIds) {
                count++;
                if(btn) btn.innerHTML = '⏳ Escaneando ' + count + '/' + cityIds.length;
                
                await new Promise(r => setTimeout(r, 600));
                const response = await fetch('/index.php?view=city&cityId=' + cityId);
                const htmlText = await response.text();
                const regex = /window\.dataSetForView\s*=\s*(\{.*?\});/s;
                const match = htmlText.match(regex);

                if (match && match[1]) {
                    try {
                        const backgroundDataSet = JSON.parse(match[1]);
                        empire = extractData(backgroundDataSet, htmlText, empire, cityId);
                    } catch (parseErr) { console.error("Erro no parse da cidade " + cityId); }
                }
            }

            saveEmpire(empire);
            if(btn) {
                btn.innerHTML = '✅ Escaneado!';
                setTimeout(() => updateButtonsUI(), 2000);
            }

        } catch (e) {
            console.error(e);
            if(btn) btn.innerHTML = '❌ Erro no Script';
        } finally {
            if(btn) btn.disabled = false;
        }
    }

    function sendData() {
        const empire = getStoredEmpire();
        const payload = Object.values(empire);
        
        if (payload.length === 0) { 
            alert("Nenhum dado encontrado. Clique em 'Escanear Tudo' primeiro."); 
            return; 
        }

        const btn = document.getElementById(SYNC_BUTTON_ID);
        if(btn) btn.innerHTML = '⏳ Conectando...';

        const targetWindow = window.open(APP_URL, 'ikariam_booster_target');
        
        // Aguarda a janela carregar e envia os dados
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (targetWindow) {
                targetWindow.postMessage({ type: 'IKARIAM_EMPIRE_DATA', payload: payload }, '*');
                if (attempts > 5) {
                    clearInterval(interval);
                    if(btn) {
                        btn.innerHTML = '✅ Enviado!';
                        setTimeout(() => updateButtonsUI(), 2000);
                    }
                }
            } else {
                clearInterval(interval);
                alert("Pop-up bloqueado! Permita pop-ups para sincronizar.");
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
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:8px;';

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
        btn.style.cssText = 'padding:12px 20px;background-color:'+color+';color:#FFF;border:2px solid rgba(255,255,255,0.4);border-radius:12px;cursor:pointer;font-weight:bold;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.4);transition:all 0.2s;text-align:center;min-width:200px;';
        btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.filter = 'brightness(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.filter = 'brightness(1)'; };
    }

    // Inicializa após um pequeno delay para garantir que o objeto ikariam esteja pronto
    setTimeout(createUI, 2000);
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
              <Download className="w-5 h-5" /> Instalar Script v4.5 (Correção de Sincronia)
            </h3>
            <button onClick={onClose} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
              <h4 className="text-emerald-900 font-bold mb-2 flex items-center gap-2">
                <Check className="w-4 h-4" /> O que foi corrigido:
              </h4>
              <ul className="text-sm text-emerald-800 space-y-1 list-disc ml-5">
                <li><strong>Armazenamento Seguro:</strong> Os dados agora são salvos no armazenamento interno do Tampermonkey, evitando que o jogo "esqueça" o que foi escaneado.</li>
                <li><strong>Escaneamento Preciso:</strong> Corrigida falha onde as cidades eram detectadas mas os recursos vinham vazios.</li>
                <li><strong>Envio Inteligente:</strong> O botão Enviar agora valida se os dados existem antes de abrir a janela.</li>
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
            
            <div className="mt-6 text-xs text-stone-500 italic">
              * Nota: Após atualizar o código no Tampermonkey, recarregue a página do Ikariam para que as mudanças façam efeito.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TampermonkeyModal;