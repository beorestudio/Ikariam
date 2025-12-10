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

  // Real extraction logic script
  const scriptCode = `// ==UserScript==
// @name         Ikariam Empire Connector
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Envia dados reais do Ikariam para o Ikariam Booster
// @author       Ikariam Booster
// @match        https://*.ikariam.gameforge.com/*
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    const APP_URL = "${appUrl}"; 
    const SYNC_BUTTON_ID = 'ikariam-booster-sync-btn';

    console.log("Ikariam Connector v2 Iniciado. Alvo:", APP_URL);

    // --- Mapeamentos ---
    // Mapeia IDs/Nomes do Ikariam para os IDs do nosso App
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
        'shrineOfOlympus': 'shrine', // Verifica nome correto ingame se necessário
        'dump': 'dump'
    };

    function getIkariamData() {
        try {
            const ika = unsafeWindow.ikariam;
            if (!ika || !ika.model) {
                console.error("Modelo do Ikariam não encontrado.");
                return null;
            }

            const relatedData = ika.model.relatedCityData;
            const citiesList = [];

            // relatedCityData é um objeto onde as chaves são "city_ID"
            Object.keys(relatedData).forEach(key => {
                if (!key.startsWith('city_')) return;
                
                const data = relatedData[key];
                
                // Preparar objeto de recursos
                const resources = {};
                
                // Função auxiliar para mapear recursos
                const mapRes = (rawKey, prodKey, capKey) => {
                    const mappedName = RESOURCE_MAP[rawKey] || RESOURCE_MAP[prodKey];
                    if (!mappedName) return;

                    const current = data.currentResources ? (data.currentResources[rawKey] || 0) : 0;
                    const prod = data.resourceProduction ? (data.resourceProduction[prodKey] || 0) : 0;
                    // Capacidade é um pouco complexa no objeto global, as vezes vem bruta, as vezes calculada.
                    // Fallback para storageCapacity geral se não houver específico
                    const cap = data.maxResources ? (data.maxResources[rawKey] || data.storageCapacity || 0) : (data.storageCapacity || 0);

                    resources[mappedName] = {
                        resourceType: mappedName,
                        currentAmount: Math.floor(current),
                        production: Math.floor(prod * 3600), // Ikariam prod é por segundo normalmente no modelo interno
                        maxCapacity: Math.floor(cap),
                        isFull: current >= cap
                    };
                };

                // Madeira (resource / production)
                mapRes('resource', 'resource'); 
                // Luxo (depends on trade good type)
                if (data.producedTradegood) {
                    mapRes(data.producedTradegood, data.producedTradegood);
                }
                // Tenta mapear todos os índices numéricos conhecidos (1,2,3,4) caso existam no currentResources
                ['1','2','3','4'].forEach(idx => {
                    if (data.currentResources && data.currentResources[idx] !== undefined) {
                        mapRes(idx, idx);
                    }
                });

                // Edifícios
                // O objeto global 'position' contém os edifícios da cidade ATUAL.
                // Para outras cidades, o relatedCityData nem sempre tem os edifícios detalhados a menos que tenhamos visitado.
                const buildings = [];
                if (data.position && Array.isArray(data.position)) {
                    data.position.forEach(pos => {
                        if (pos && pos.building) {
                            const mappedId = BUILDING_MAP[pos.building] || pos.building;
                            buildings.push({
                                buildingId: mappedId,
                                level: pos.level,
                                name: pos.name || mappedId, // Fallback name
                                position: pos.position
                            });
                        }
                    });
                }

                // Coordenadas
                const coords = \`[\${data.coords}]\`; // Geralmente "[x:y]" já vem formatado ou separado

                citiesList.push({
                    id: data.id,
                    name: data.name,
                    coords: coords,
                    islandId: data.islandId,
                    resources: resources,
                    buildings: buildings,
                    updatedAt: Date.now()
                });
            });

            return citiesList;

        } catch (e) {
            console.error("Erro ao extrair dados do Ikariam:", e);
            alert("Erro ao ler dados do jogo. Veja o console (F12).");
            return null;
        }
    }

    function createUI() {
        if (document.getElementById(SYNC_BUTTON_ID)) return;

        const btn = document.createElement('button');
        btn.id = SYNC_BUTTON_ID;
        btn.innerHTML = '⚡ <b>Enviar p/ Booster</b>';
        btn.style.position = 'fixed';
        btn.style.bottom = '15px';
        btn.style.right = '15px';
        btn.style.zIndex = '99999';
        btn.style.padding = '12px 20px';
        btn.style.backgroundColor = '#8B4513'; // Amber-900 like
        btn.style.color = '#FFF';
        btn.style.border = '2px solid #FCD34D'; // Amber-300 like
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        btn.style.fontFamily = 'Arial, sans-serif';
        btn.style.fontSize = '14px';
        btn.style.transition = 'transform 0.1s';

        btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';

        btn.onclick = () => {
            const data = getIkariamData();
            if (data && data.length > 0) {
                sendData(data);
            } else {
                alert("Nenhum dado de cidade encontrado. Certifique-se de estar logado no jogo.");
            }
        };

        document.body.appendChild(btn);
    }

    function sendData(payload) {
        // Tenta encontrar a janela aberta do Booster
        // Se o usuário abriu o jogo a partir do link "Conectar", window.opener pode existir (mas cross-origin bloqueia acesso direto, postMessage funciona)
        // Se não, tentamos abrir/focar a janela ou usar BroadcastChannel se estivesse na mesma origem (não estão).
        
        // Estratégia Principal: window.open para focar ou abrir a aba do app
        const targetWindow = window.open(APP_URL, 'ikariam_booster_target');
        
        if (targetWindow) {
            // Pequeno delay para garantir que o React processou se a aba acabou de abrir
            setTimeout(() => {
                targetWindow.postMessage({
                    type: 'IKARIAM_EMPIRE_DATA',
                    payload: payload
                }, '*'); // Em produção, restrinja para APP_URL
                
                // Feedback visual no botão
                const btn = document.getElementById(SYNC_BUTTON_ID);
                if(btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✅ Dados Enviados!';
                    btn.style.backgroundColor = '#059669'; // Green
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.backgroundColor = '#8B4513';
                    }, 2000);
                }
            }, 1000);
        } else {
            alert("Não foi possível conectar à aba do Booster. Permita popups ou mantenha a aba aberta.");
        }
    }

    // Inicialização
    // Espera o carregamento do objeto ikariam
    const checkInterval = setInterval(() => {
        if (unsafeWindow.ikariam && unsafeWindow.ikariam.model) {
            clearInterval(checkInterval);
            createUI();
            console.log("Ikariam Booster: UI Injetada");
        }
    }, 1000);

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
              <Download className="w-5 h-5" /> Instalar Script Tampermonkey
            </h3>
            <button onClick={onClose} className="text-emerald-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-stone-800 font-semibold mb-2">Instruções de Instalação:</h4>
              <ol className="list-decimal list-inside text-sm text-stone-600 space-y-2">
                <li>Certifique-se de ter a extensão <strong>Tampermonkey</strong> instalada.</li>
                <li>No painel do Tampermonkey, clique em <strong>Adicionar novo script</strong> (+).</li>
                <li>Apague qualquer código que já esteja no editor.</li>
                <li>Clique no botão <strong>Copiar Código</strong> abaixo e cole no editor.</li>
                <li>Salve o script (Arquivo &gt; Salvar ou Ctrl+S).</li>
                <li>Vá para a página do jogo Ikariam e recarregue (F5).</li>
                <li>Um botão marrom <strong>"Enviar p/ Booster"</strong> aparecerá no canto inferior direito da tela.</li>
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
                <strong>Dica:</strong> O script coleta recursos de <em>todas</em> as cidades automaticamente. Para os <strong>edifícios</strong>, ele envia os dados da cidade que você está visualizando no momento. Navegue entre suas cidades no jogo e clique no botão para atualizar os edifícios de cada uma.
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