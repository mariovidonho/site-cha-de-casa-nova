// Configurações do Site
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9GCSKxGQ7nA1l-HHVDD2JoT-6tYQOB_6GrWL10XhVYYGGXqEChxsmJqQsgEiFkQql/exec";
const CHAVE_PIX = "mariovidonhoferreira@gmail.com"; // Substitua pela chave Pix real da família

// Lista de Convidados Fechada
const guests = [
    "Danilo", "Susana", "Nayara", "Emerson", "Edmilson", "Diane", "Sandra", 
    "Erick", "Emily", "Edson", "Naethy", "Lucas", "Paula", "Victor", 
    "Claudia", "Laynara", "Arthur", "Raissa", "Rayane", "Wellington", 
    "Marcos", "Gabi"
];

// Lista de Presentes - Atualizada (22 itens)
const gifts = [
    { id: 1, name: "Kit de potes herméticos", category: "Cozinha", icon: "box" },
    { id: 2, name: "Jogo de toalhas de banho", category: "Banheiro", icon: "bath" },
    { id: 3, name: "Conjunto de xícaras para café", category: "Mesa", icon: "coffee" },
    { id: 4, name: "Porta-temperos com suporte", category: "Cozinha", icon: "package" },
    { id: 5, name: "Jogo americano (4 a 6 peças)", category: "Mesa", icon: "utensils" },
    { id: 6, name: "Jarra de vidro com copos", category: "Mesa", icon: "glass-water" },
    { id: 7, name: "Kit de travesseiros", category: "Quarto", icon: "bed" },
    { id: 8, name: "Kit de facas", category: "Cozinha", icon: "utensils" },
    { id: 9, name: "Sanduicheira elétrica", category: "Cozinha", icon: "plug" },
    { id: 10, name: "Liquidificador", category: "Cozinha", icon: "plug" },
    { id: 11, name: "Kit de assadeiras", category: "Cozinha", icon: "box" },
    { id: 12, name: "Escorredor de louças", category: "Cozinha", icon: "utensils" },
    { id: 13, name: "Organizador de banheiro", category: "Banheiro", icon: "bath" },
    { id: 14, name: "Ferro a vapor", category: "Lavanderia", icon: "sparkles" },
    { id: 15, name: "Jogo de panelas básico", category: "Cozinha", icon: "flame" },
    { id: 16, name: "Edredom casal", category: "Quarto", icon: "bed" },
    { id: 17, name: "Mixer com acessórios", category: "Cozinha", icon: "plug" },
    { id: 18, name: "Aspirador portátil", category: "Limpeza", icon: "wind" },
    { id: 19, name: "Kit completo de utensílios de cozinha", category: "Cozinha", icon: "utensils" },
    { id: 20, name: "Conjunto de panelas antiaderentes", category: "Cozinha", icon: "flame" },
    { id: 21, name: "Air fryer", category: "Cozinha", icon: "plug" },
    { id: 22, name: "Aspirador vertical", category: "Limpeza", icon: "wind" }
];

let chosenGiftsList = [];     // Presentes já escolhidos (carregados do Google Sheets)
let confirmedGuestsList = [];  // Convidados que já confirmaram presença (carregados do Google Sheets)
let activeGift = null;        // Presente selecionado no modal atual

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    await fetchSheetData();
    renderRsvpDropdown();
    renderGifts();
    setupScrollReveal();
}

// Configura os ouvintes de evento da página
function setupEventListeners() {
    // Form RSVP
    const formRsvp = document.getElementById("form-rsvp");
    if (formRsvp) {
        formRsvp.addEventListener("submit", handleRsvpSubmit);
    }

    // Modal close
    const btnCloseModal = document.getElementById("btn-close-modal");
    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", closeModal);
    }

    // Click outside modal to close
    const giftModal = document.getElementById("gift-modal");
    if (giftModal) {
        giftModal.addEventListener("click", (e) => {
            if (e.target === giftModal) {
                closeModal();
            }
        });
    }

    // Form Confirmação de Presente
    const formGiftConfirm = document.getElementById("form-gift-confirm");
    if (formGiftConfirm) {
        formGiftConfirm.addEventListener("submit", handleGiftConfirmSubmit);
    }

    // Copiar PIX
    const btnCopyPix = document.getElementById("btn-copy-pix");
    if (btnCopyPix) {
        btnCopyPix.addEventListener("click", copyPixKey);
    }

    // Navegação do Carrossel de Presentes (Vertical)
    const btnUp = document.querySelector(".btn-up");
    const btnDown = document.querySelector(".btn-down");
    const viewport = document.getElementById("gifts-viewport");

    if (btnUp && btnDown && viewport) {
        btnUp.addEventListener("click", () => {
            viewport.scrollBy({ top: -320, behavior: "smooth" });
        });
        btnDown.addEventListener("click", () => {
            viewport.scrollBy({ top: 320, behavior: "smooth" });
        });
    }
}

// Carrega os presentes escolhidos e convidados confirmados do Google Sheets
async function fetchSheetData() {
    try {
        const response = await fetch(SCRIPT_URL);
        if (response.ok) {
            const data = await response.json();
            chosenGiftsList = data.presentes || [];
            confirmedGuestsList = (data.convidados || []).map(name => name.trim().toLowerCase());
        }
    } catch (error) {
        console.warn("Não foi possível carregar dados do Google Sheets. Usando cache local.", error);
        
        // Fallback localstorage para presentes
        const localGifts = localStorage.getItem("my_chosen_gifts") || "[]";
        chosenGiftsList = JSON.parse(localGifts).map(name => ({ presente: name, nome: "Você" }));
        
        // Fallback localstorage para convidados
        const localGuests = localStorage.getItem("my_confirmed_rsvps") || "[]";
        confirmedGuestsList = JSON.parse(localGuests).map(name => name.trim().toLowerCase());
    }
}

// Renderiza a lista de convidados pendentes no select do RSVP
function renderRsvpDropdown() {
    const selectEl = document.getElementById("rsvp-nome");
    const btnSubmit = document.getElementById("btn-submit-rsvp");
    if (!selectEl) return;

    selectEl.innerHTML = "";

    // Filtra apenas os convidados que ainda NÃO confirmaram
    const availableGuests = guests.filter(guest => !confirmedGuestsList.includes(guest.trim().toLowerCase()));

    if (availableGuests.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Todos os convidados já confirmaram presença! ❤️";
        opt.disabled = true;
        opt.selected = true;
        selectEl.appendChild(opt);
        
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>Presenças Confirmadas!</span>';
        }
        return;
    }

    // Opção padrão instrutiva
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Escolha seu nome na lista...";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    selectEl.appendChild(defaultOpt);

    // Ordena os convidados em ordem alfabética e renderiza
    availableGuests.sort().forEach(guest => {
        const opt = document.createElement("option");
        opt.value = guest;
        opt.textContent = guest;
        selectEl.appendChild(opt);
    });
    
    if (btnSubmit) {
        btnSubmit.disabled = false;
    }
}

// Renderiza os presentes na tela
function renderGifts() {
    const container = document.getElementById("gifts-container");
    if (!container) return;

    container.innerHTML = "";

    gifts.forEach(gift => {
        // Verifica se o presente já foi escolhido por alguém
        const isChosen = chosenGiftsList.find(c => c.presente.trim().toLowerCase() === gift.name.trim().toLowerCase());
        
        const card = document.createElement("div");
        card.className = `gift-card ${isChosen ? 'is-chosen' : ''}`;
        
        const statusBadge = isChosen 
            ? `<span class="gift-status-badge chosen">Escolhido por ${isChosen.nome}</span>`
            : `<span class="gift-status-badge available">Disponível</span>`;

        card.innerHTML = `
            <div>
                <div class="gift-card-top">
                    <div class="gift-icon-box">
                        <i data-lucide="${gift.icon}"></i>
                    </div>
                    ${statusBadge}
                </div>
                <h3>${gift.name}</h3>
                <span class="gift-category">${gift.category}</span>
            </div>
            <button class="btn btn-block ${isChosen ? 'btn-outline' : 'btn-primary'}" 
                ${isChosen ? 'disabled' : ''} 
                onclick="openGiftModal(${gift.id})">
                ${isChosen ? 'Presente Escolhido' : 'Escolher este presente'}
            </button>
        `;
        
        container.appendChild(card);
    });

    // Recria os ícones do Lucide para os elementos recém-renderizados
    lucide.createIcons();
}

// Abre o modal de escolha de presente
window.openGiftModal = function(giftId) {
    const gift = gifts.find(g => g.id === giftId);
    if (!gift) return;

    activeGift = gift;
    
    const modal = document.getElementById("gift-modal");
    const modalGiftName = document.getElementById("modal-gift-name");
    const formConfirm = document.getElementById("form-gift-confirm");
    const successMsg = document.getElementById("gift-success-msg");

    if (modal && modalGiftName && formConfirm && successMsg) {
        modalGiftName.textContent = gift.name;
        formConfirm.classList.remove("hidden");
        successMsg.classList.add("hidden");
        modal.classList.add("active");
        
        // Foca no input de nome
        setTimeout(() => {
            document.getElementById("gift-user-name").focus();
        }, 100);
    }
};

// Fecha o modal
function closeModal() {
    const modal = document.getElementById("gift-modal");
    if (modal) {
        modal.classList.remove("active");
        activeGift = null;
    }
}

// Envia a confirmação de presença (RSVP) para o Google Sheets
async function handleRsvpSubmit(e) {
    e.preventDefault();
    
    const btnSubmit = document.getElementById("btn-submit-rsvp");
    const nameInput = document.getElementById("rsvp-nome").value;
    const messageInput = document.getElementById("rsvp-mensagem").value;
    const successMsg = document.getElementById("rsvp-success");
    const formRsvp = document.getElementById("form-rsvp");

    if (!btnSubmit || !nameInput) return;

    // Desabilita botão e mostra estado de carregamento
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Enviando...</span> <i data-lucide="loader" class="animate-spin"></i>';
    lucide.createIcons();

    const payload = {
        tipo: "RSVP",
        nome: nameInput,
        acompanhantes: 0, // Mantido 0 para preservar o schema da planilha
        mensagem: messageInput
    };

    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // Salva no localStorage local
        const local = JSON.parse(localStorage.getItem("my_confirmed_rsvps") || "[]");
        local.push(nameInput);
        localStorage.setItem("my_confirmed_rsvps", JSON.stringify(local));

        // Atualiza a lista local de confirmados e re-renderiza o select
        confirmedGuestsList.push(nameInput.trim().toLowerCase());
        renderRsvpDropdown();

        formRsvp.classList.add("hidden");
        successMsg.classList.remove("hidden");
    } catch (error) {
        console.error("Erro ao enviar RSVP:", error);
        alert("Ops! Ocorreu um erro ao enviar sua confirmação. Por favor, tente novamente.");
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
        lucide.createIcons();
    }
}

// Confirma a escolha do presente e envia para o Google Sheets
async function handleGiftConfirmSubmit(e) {
    e.preventDefault();
    
    if (!activeGift) return;

    const btnSubmit = document.getElementById("btn-submit-gift");
    const guestName = document.getElementById("gift-user-name").value;
    const formConfirm = document.getElementById("form-gift-confirm");
    const successMsg = document.getElementById("gift-success-msg");

    if (!btnSubmit) return;

    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Confirmando...</span>';

    const payload = {
        tipo: "Presente",
        nome: guestName,
        presente: activeGift.name
    };

    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // Salva no localStorage local
        const local = JSON.parse(localStorage.getItem("my_chosen_gifts") || "[]");
        local.push(activeGift.name);
        localStorage.setItem("my_chosen_gifts", JSON.stringify(local));

        // Atualiza a visualização localmente
        chosenGiftsList.push({ presente: activeGift.name, nome: guestName });
        renderGifts();

        formConfirm.classList.add("hidden");
        successMsg.classList.remove("hidden");

        // Fecha o modal após 2 segundos
        setTimeout(() => {
            closeModal();
            // Limpa o formulário
            document.getElementById("gift-user-name").value = "";
        }, 2500);

    } catch (error) {
        console.error("Erro ao confirmar presente:", error);
        alert("Ops! Ocorreu um erro ao escolher o presente. Por favor, tente novamente.");
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

// Copia a chave Pix para a área de transferência
function copyPixKey() {
    const copyTextEl = document.getElementById("copy-text");
    const copyIconEl = document.getElementById("copy-icon");

    if (!copyTextEl || !copyIconEl) return;

    navigator.clipboard.writeText(CHAVE_PIX).then(() => {
        copyTextEl.textContent = "Chave Copiada!";
        copyIconEl.setAttribute("data-lucide", "check");
        lucide.createIcons();

        setTimeout(() => {
            copyTextEl.textContent = "Copiar Chave";
            copyIconEl.setAttribute("data-lucide", "copy");
            lucide.createIcons();
        }, 2000);
    }).catch(err => {
        console.error("Erro ao copiar chave Pix:", err);
        alert("Não foi possível copiar automaticamente. A chave é: " + CHAVE_PIX);
    });
}

// Configura o Scroll Reveal com Intersection Observer
function setupScrollReveal() {
    const reveals = document.querySelectorAll(".reveal-up, .reveal-fade");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
    });
    
    reveals.forEach(el => observer.observe(el));
}
