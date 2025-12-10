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
// @name         Ikariam Empire Connector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Envia dados do Ikariam para o Ikariam Booster
// @author       Ikariam Booster
// @match        https://*.ikariam.gameforge.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // CONFIGURAÇÃO: URL do seu App (Localhost ou Vercel)
    const APP_URL = "${appUrl}"; 
    // ^^^ O script atualiza isso automaticamente com a URL atual, 
    // mas se hospedar em outro lugar, altere aqui.

    console.log("Ikariam Connector Iniciado. Alvo:", APP_URL);

    // Função para extrair dados
    function extractData() {
        try {
            const data = unsafeWindow.ikariam.getScreen().data; // Tenta pegar do objeto global do jogo
            // Nota: A estrutura real do objeto do Ikariam varia. 
            // Este é um exemplo estrutural de como o script funcionaria.
            // Em um cenário real, precisaríamos parsear o DOM ou acessar 'ika.model'.
            
            // Vamos simular a extração baseada no que geralmente está disponível no 'ika' object
            const cityData = [];
            
            // Exemplo de acesso ao modelo global (hipotético, depende da versão do jogo)
            // const cities = ikariam.model.cities; 
            
            // Para este exemplo funcionar no app de demonstração, 
            // vamos criar um botão na interface do jogo para "Enviar Dados"
            // que raspa o DOM da visualização atual.
        } catch (e) {
            console.error("Erro ao extrair dados", e);
        }
    }

    // Criação do Botão na Interface do Jogo
    function createSyncButton() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        
        const btn = document.createElement('button');
        btn.innerText = "Sincronizar com Booster";
        btn.style.backgroundColor = "#8B4513";
        btn.style.color = "white";
        btn.style.border = "2px solid #DAA520";
        btn.style.padding = "10px";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        btn.style.borderRadius = "5px";
        
        btn.onclick = function() {
            syncData();
        };
        
        container.appendChild(btn);
        document.body.appendChild(container);
    }

    function syncData() {
        // Coleta dados FALSOS/MOCKUP para demonstração se não conseguir ler o jogo real
        // Num script real, aqui vai a lógica de scraping:
        // var wood = document.getElementById('value_wood').innerText...
        
        const mockCities = [
            {
                id: 1,
                name: "Polis Alpha",
                coords: "[50:50]",
                islandId: 100,
                resources: {
                    "Madeira": { currentAmount: Math.floor(Math.random()*10000), maxCapacity: 20000, production: 500 },
                    "Vinho": { currentAmount: Math.floor(Math.random()*5000), maxCapacity: 10000, production: 0 },
                    "Mármore": { currentAmount: Math.floor(Math.random()*8000), maxCapacity: 15000, production: 300 }
                },
                buildings: [
                    { buildingId: "town_hall", level: 25, name: "Câmara Municipal" },
                    { buildingId: "academy", level: 18, name: "Academia" }
                ],
                updatedAt: Date.now()
            },
            {
                id: 2,
                name: "Vinha do Monte",
                coords: "[50:51]",
                islandId: 101,
                resources: {
                    "Madeira": { currentAmount: 32000, maxCapacity: 50000, production: 900 },
                    "Vinho": { currentAmount: 15000, maxCapacity: 40000, production: 600 }
                },
                buildings: [
                    { buildingId: "town_hall", level: 20, name: "Câmara Municipal" },
                    { buildingId: "warehouse", level: 25, name: "Armazém" }
                ],
                updatedAt: Date.now()
            }
        ];

        // Enviar para a janela pai ou janela aberta
        // Tenta encontrar a janela do app
        // Nota: window.opener funciona se o app abriu o jogo, ou vice-versa.
        // Se estiverem separados, postMessage pode falhar sem referência direta.
        // Solução comum: O script abre um popup oculto do app para postar e fecha.
        
        const targetWindow = window.open('${appUrl}', 'ikariam_booster_target');
        
        if (targetWindow) {
            setTimeout(() => {
                targetWindow.postMessage({
                    type: 'IKARIAM_EMPIRE_DATA',
                    payload: mockCities
                }, '${appUrl}');
                // targetWindow.close(); // Opcional: fechar após envio se for popup
            }, 2000); // Espera carregar
        } else {
            alert("Permita popups para sincronizar ou mantenha a aba do Booster aberta.");
        }
    }

    // Inicializa
    setTimeout(createSyncButton, 2000);

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
              <h4 className="text-stone-800 font-semibold mb-2">Como configurar a sincronização em tempo real:</h4>
              <ol className="list-decimal list-inside text-sm text-stone-600 space-y-2">
                <li>Instale a extensão <strong>Tampermonkey</strong> no seu navegador.</li>
                <li>Crie um <strong>Novo Script</strong> no painel do Tampermonkey.</li>
                <li>Apague todo o conteúdo padrão e cole o código abaixo.</li>
                <li>Salve o script.</li>
                <li>Recarregue a página do Ikariam. Um botão "Sincronizar" aparecerá no canto inferior direito.</li>
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
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md text-xs text-yellow-800 flex items-start gap-2">
              <span className="font-bold text-lg leading-none">!</span>
              <p>
                Este script de exemplo gera dados aleatórios (mockup) para testar a conexão com esta janela.
                Para funcionar no jogo real, a lógica de <code>extractData</code> precisaria ser ajustada para ler o DOM específico da versão atual do Ikariam.
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