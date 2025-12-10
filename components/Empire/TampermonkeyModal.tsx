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
// @name         Ikariam Empire Connector v3
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Coleta dados conforme você navega e envia para o Booster
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
    }

    function parseCurrentView() {
        try {
            const dataSet = unsafeWindow.dataSetForView;
            if (!dataSet || !dataSet.relatedCityData || !dataSet.relatedCityData.selectedCity) return;

            const selectedCityKey = dataSet.relatedCityData.selectedCity; // e.g. "city_7511"
            const cityInfo = dataSet.relatedCityData[selectedCityKey];
            const cityId = cityInfo.id;

            // Carrega império existente para atualizar apenas esta cidade
            const empire = getStoredEmpire();

            // 1. Parse Resources
            // O jogo usa resourceProduction como float por segundo (geralmente)
            const woodProd = (dataSet.resourceProduction || 0) * 3600; 
            const luxuryType = dataSet.producedTradegood; 
            const luxuryProd = (dataSet.tradegoodProduction || 0) * 3600;

            const resources = {};
            
            // Helper para montar obj de recurso
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
            // Zera produção dos outros tipos
            ['1','2','3','4'].forEach(k => {
                if(k !== luxuryType) setRes(k, k, 0);
            });

            // 2. Parse Buildings
            // Só conseguimos ler edifícios se estivermos na visão da cidade
            let buildings = [];
            const screen = unsafeWindow.ikariam.getScreen();
            const isCityView = dataSet.viewParams.view === 'city';

            if (isCityView && screen && screen.data && screen.data.position) {
                buildings = screen.data.position.map(pos => {
                    if (!pos.building) return null;
                    return {
                        buildingId: BUILDING_MAP[pos.building] || pos.building,
                        level: parseInt(pos.level),
                        name: pos.name,
                        position: pos.position
                    };
                }).filter(b => b !== null);
            } else {
                // Se não estiver na visão da cidade, mantém os edifícios antigos do cache
                if (empire[cityId] && empire[cityId].buildings) {
                    buildings = empire[cityId].buildings;
                }
            }

            // Atualiza objeto da cidade
            empire[cityId] = {
                id: cityId,
                name: cityInfo.name,
                coords: cityInfo.coords,
                islandId: dataSet.viewParams.islandId, // Disponível no viewParams
                resources: resources,
                buildings: buildings,
                updatedAt: Date.now()
            };

            saveEmpire(empire);
            // console.log('Ikariam Booster: Cidade atualizada', empire[cityId]);
            updateButtonStatus(Object.keys(empire).length);

        } catch (e) {
            console.error('Ikariam Booster: Erro ao ler dados', e);
        }
    }

    function sendData() {
        const empire = getStoredEmpire();
        const payload = Object.values(empire);

        if (payload.length === 0) {
            alert("Nenhum dado coletado ainda. Navegue pelas suas cidades para o script ler os dados.");
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
                    setTimeout(() => {
                        btn.innerHTML = '⚡ Enviar (' + payload.length + ')';
                        btn.style.backgroundColor = '#8B4513';
                    }, 2000);
                }
            }, 1500);
        } else {
            alert("Habilite popups para permitir a conexão com o Booster.");
        }
    }

    function updateButtonStatus(count) {
        const btn = document.getElementById(SYNC_BUTTON_ID);
        if(btn) btn.innerHTML = '⚡ Enviar (' + count + ')';
    }

    function createUI() {
        if (document.getElementById(SYNC_BUTTON_ID)) return;

        const empire = getStoredEmpire();
        const count = Object.keys(empire).length;

        const btn = document.createElement('button');
        btn.id = SYNC_BUTTON_ID;
        btn.innerHTML = '⚡ Enviar (' + count + ')';
        btn.style.position = 'fixed';
        btn.style.bottom = '15px';
        btn.style.right = '15px';
        btn.style.zIndex = '99999';
        btn.style.padding = '10px 15px';
        btn.style.backgroundColor = '#8B4513';
        btn.style.color = '#FFF';
        btn.style.border = '2px solid #FCD34D';
        btn.style.borderRadius = '50px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '13px';
        
        btn.onclick = sendData;
        document.body.appendChild(btn);
    }

    // Inicialização
    setTimeout(() => {
        parseCurrentView();
        createUI();
    }, 1000);

    // Tenta atualizar também em respostas AJAX (navegação interna)
    // Intercepta XMLHttpRequest nativo para detectar mudanças de cidade sem reload
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('load', function() {
            setTimeout(parseCurrentView, 500); // Espera o DOM atualizar
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
              <Download className="w-5 h-5" /> Instalar Script Tampermonkey v3
            </h3>
            <button onClick={onClose} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-stone-800 font-semibold mb-2">Instruções de Atualização:</h4>
              <ol className="list-decimal list-inside text-sm text-stone-600 space-y-2">
                <li>Abra o painel do <strong>Tampermonkey</strong> e edite o script antigo.</li>
                <li>Substitua <strong>todo</strong> o código pelo novo código abaixo.</li>
                <li>Salve (Ctrl+S).</li>
                <li>Recarregue a página do Ikariam.</li>
                <li><strong>Importante:</strong> Visite cada uma das suas cidades uma vez para que o script capture os edifícios e recursos de todas elas. O contador no botão irá aumentar.</li>
                <li>Quando terminar, clique em "Enviar".</li>
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
                O script agora possui uma memória interna. Ele grava os dados de cada cidade que você visita.
                Isso garante que ao clicar em enviar, os dados de <strong>todas</strong> as cidades visitadas sejam enviados de uma vez, e não apenas a atual.
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