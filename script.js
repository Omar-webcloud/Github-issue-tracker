/* default user name: "admin" . default pass: "admin123" */

const STATE = {
  issues: [],
  filteredIssues: [],
  currentTab: "all",
  searchQuery: "",
  isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
};

const getUI = () => ({
  loginForm: document.getElementById("login-form"),
  usernameInput: document.getElementById("username"),
  passwordInput: document.getElementById("password"),

  issuesGrid: document.getElementById("issues-grid"),
  issueCount: document.getElementById("issue-count"),
  spinner: document.getElementById("loading-spinner"),
  tabs: document.querySelectorAll(".tab-btn"),
  searchInput: document.getElementById("search-input"),
  modal: document.getElementById("issue-modal"),
  modalContent: document.getElementById("modal-content"),
});

function init() {
  const UI = getUI();
  const isLoginPage = !!UI.loginForm;
  const isDashboardPage = !!UI.issuesGrid;

  if (isLoginPage) {
    if (STATE.isLoggedIn) {
      window.location.href = "main.html";
      return;
    }
    setupLoginListeners(UI);
  }

  if (isDashboardPage) {
    if (!STATE.isLoggedIn) {
      window.location.href = "index.html";
      return;
    }
    setupDashboardListeners(UI);
    fetchIssues();
  }
}

function setupLoginListeners(UI) {
  UI.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = UI.usernameInput.value;
    const pass = UI.passwordInput.value;

    if (user === "admin" && pass === "admin123") {
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "main.html";
    } else {
      alert("Invalid credentials! Use admin / admin123");
    }
  });
}

function setupDashboardListeners(UI) {
  UI.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      UI.tabs.forEach((t) => {
        t.classList.remove("bg-indigo-600", "text-white");
        t.classList.add("text-gray-500");
      });
      tab.classList.add("bg-indigo-600", "text-white");
      tab.classList.remove("text-gray-500");

      STATE.currentTab = tab.dataset.tab;
      filterAndRender();
    });
  });

  UI.searchInput.addEventListener("input", (e) => {
    STATE.searchQuery = e.target.value;
    if (STATE.searchQuery.trim().length > 0) {
      searchIssues(STATE.searchQuery);
    } else {
      fetchIssues();
    }
  });
}

async function fetchIssues() {
  const UI = getUI();
  if (!UI.spinner) return;

  UI.spinner.classList.remove("hidden");
  UI.issuesGrid.innerHTML = "";

  try {
    const response = await fetch(
      "https://phi-lab-server.vercel.app/api/v1/lab/issues",
    );
    const data = await response.json();
    STATE.issues = data.data || [];
    filterAndRender();
  } catch (error) {
    console.error("Error fetching issues:", error);
    UI.issuesGrid.innerHTML =
      '<p class="text-red-500 col-span-4 text-center py-10 font-bold">Failed to load issues.</p>';
  } finally {
    UI.spinner.classList.add("hidden");
  }
}

async function searchIssues(query) {
  const UI = getUI();
  UI.spinner.classList.remove("hidden");
  UI.issuesGrid.innerHTML = "";

  try {
    const response = await fetch(
      `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();
    STATE.issues = data.data || [];
    filterAndRender();
  } catch (error) {
    console.error("Error searching issues:", error);
  } finally {
    UI.spinner.classList.add("hidden");
  }
}

function filterAndRender() {
  const UI = getUI();
  let filtered = STATE.issues;

  if (STATE.currentTab !== "all") {
    filtered = filtered.filter(
      (i) => i.status.toLowerCase() === STATE.currentTab,
    );
  }

  STATE.filteredIssues = filtered;
  UI.issueCount.textContent = filtered.length;
  renderCards(UI);
}

function renderCards(UI) {
  UI.issuesGrid.innerHTML = STATE.filteredIssues
    .map(
      (issue) => `
        <div class="card bg-white shadow-sm border-t-4 ${issue.status.toLowerCase() === "open" ? "border-green-500" : "border-purple-500"} hover:shadow-md transition-all duration-200 cursor-pointer" onclick="showDetails('${issue.id}')">
            <div class="card-body p-5">
                <div class="flex justify-between items-start mb-2">
                    <span class="badge badge-ghost badge-sm font-bold uppercase tracking-wider opacity-60">${issue.priority || "NORMAL"}</span>
                    <span class="text-xs font-semibold text-gray-400">#${issue.id}</span>
                </div>
                <h3 class="card-title text-base font-bold text-gray-800 leading-tight mb-2 truncate-2-lines">${issue.title}</h3>
                <p class="text-sm text-gray-500 line-clamp-2 mb-4 h-10">${issue.description}</p>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    ${issue.labels.map((label) => `<span class="badge badge-sm bg-indigo-50 text-indigo-600 border-none font-medium px-2">${label}</span>`).join("")}
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <div class="flex items-center gap-2">
                        <div class="avatar placeholder">
                            <div class="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6">
                                <span class="text-[10px] font-bold">${issue.author.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <span class="text-xs font-bold text-gray-700">${issue.author}</span>
                    </div>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

async function showDetails(id) {
  const UI = getUI();
  UI.modalContent.innerHTML =
    '<div class="flex justify-center p-20"><span class="loading loading-spinner text-primary"></span></div>';
  UI.modal.showModal();

  try {
    const response = await fetch(
      `https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`,
    );
    const data = await response.json();
    const issue = data.data;

    UI.modalContent.innerHTML = `
            <div class="p-8">
                <div class="flex items-center gap-3 mb-6">
                    <span class="badge ${issue.status.toLowerCase() === "open" ? "badge-success" : "badge-primary"} badge-md text-white font-bold px-4 py-3">${issue.status}</span>
                    <span class="text-gray-400 font-medium">Opened by ${issue.author} • ${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 class="text-3xl font-bold text-gray-800 mb-4">${issue.title}</h2>
                
                <div class="flex gap-2 mb-8">
                    ${issue.labels.map((l) => `<span class="badge bg-gray-100 border-none text-gray-600 font-bold px-3 py-3">${l}</span>`).join("")}
                </div>

                <div class="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                    <p class="text-gray-700 leading-relaxed text-lg">${issue.description}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-xl border border-gray-100">
                        <p class="text-xs font-bold text-gray-400 uppercase mb-1">Assignee</p>
                        <p class="font-bold text-gray-800">${issue.author}</p>
                    </div>
                    <div class="bg-white p-4 rounded-xl border border-gray-100">
                        <p class="text-xs font-bold text-gray-400 uppercase mb-1">Priority</p>
                        <span class="badge badge-error text-white font-bold">${issue.priority}</span>
                    </div>
                </div>
            </div>
        `;
  } catch (error) {
    UI.modalContent.innerHTML =
      '<p class="p-10 text-center text-red-500 font-bold">Failed to load issue details.</p>';
  }
}

window.showDetails = showDetails;
window.logout = () => {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "index.html";
};

document.addEventListener("DOMContentLoaded", init);
