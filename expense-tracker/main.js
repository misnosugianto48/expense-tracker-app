/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 * Tulis seluruh kode JavaScript kamu di sini.
 */

document.addEventListener('DOMContentLoaded', init);

/** Event yang digunakan untuk me-render ulang todo */
const RENDER_EVENT = 'render-transactions';

/** Event yang dipanggil setelah data berhasil disimpan */
const SAVED_EVENT = 'saved-transactions';

/** Key LocalStorage */
const STORAGE_KEY = 'EXPENSE-TRACKER';

const elements = {
  incomeList: null,
  expenseList: null,
  totalIncome: null,
  totalExpense: null,
  balance: null,
  submitButton: null,
};

// TODO [Basic] Buat variabel array untuk menyimpan semua data transaksi, contoh: let transactions = []
/**
 * Menyimpan seluruh data transaksi keuangan.
 *
 * @type {Array<{
 *   id: string | number,
 *   title: string,
 *   amount: number,
 *   date: string,
 *   type: string
 * }>}
 *
 * @description
 * amount must be a Number() and type must be a income or expense
 */
let transactions = [];

let editTransactionId = null;
// TODO [Basic] Buat fungsi untuk menghasilkan ID unik secara otomatis, contoh: gunakan +new Date()
/**
 * Membuat ID unik dengan +new Date().
 *
 * @returns {number}
 */
function generateUniqueId() {
  return +new Date();
}

/**
 * Membuat object Transactions.
 *
 * @param {number} id
 * @param {string} titlet
 * @param {number} amount
 * @param {string} date
 * @param {string} type
 *
 * @returns {{
 * id:number,
 * titlet:string,
 * amount:number,
 * date:string
 * type:string
 * }}
 */
function createTransactionObject(id, title, amount, date, type) {
  return {
    id,
    title,
    amount,
    date,
    type,
  };
}

/**
 * Mencari transaction berdasarkan id.
 *
 * @param {number} id
 *
 * @returns {object|null}
 */
function findTransaction(id) {
  return transactions.find((t) => t.id === id) ?? null;
}

/**
 * Mencari index transaction berdasarkan id.
 *
 * @param {number} id
 *
 * @returns {number}
 */
function findTransactionIndex(id) {
  return transactions.findIndex((t) => t.id === id);
}

function init() {
  elements.incomeList = document.getElementById('incomeList');
  elements.expenseList = document.getElementById('expenseList');

  elements.totalIncome = document.querySelectorAll(
    '.tracker-summary__stat',
  )[0].children[1];
  elements.totalExpense = document.querySelectorAll(
    '.tracker-summary__stat',
  )[1].children[1];
  elements.balance = document.querySelector(
    '.tracker-summary__balance',
  ).children[1];

  elements.submitButton = document.querySelector(
    '[data-testid="transactionFormSubmitButton"]',
  );

  registerEvents();

  if (isStorageExist()) {
    loadDataFromStorage();
  }
}

function registerEvents() {
  const formAdd = document.getElementById('transactionForm');
  const searchInput = document.getElementById('searchTransactionForm');

  formAdd.addEventListener('submit', handleSubmit);
  searchInput.addEventListener('input', handleSearch);

  document.addEventListener(RENDER_EVENT, () => {
    renderTransactions();
    updateDashboard();
  });
}
/**
 * ========================================================
 * Kriteria 1: Memanipulasi DOM untuk Form dan Daftar Transaksi
 * ========================================================
 */
// TODO [Basic] Ambil elemen kontainer incomeList dan expenseList dari DOM

/**
 * TODO [Basic]:
 * Buat fungsi untuk menampilkan (render) semua transaksi ke layar:
 *  - Kosongkan kontainer terlebih dahulu sebelum mengisi ulang
 *  - Gunakan perulangan, buat setiap elemen kartu dengan document.createElement()
 *  - Pastikan setiap elemen memiliki atribut data-testid yang sesuai (lihat panduan di rubrik)
 *  - Masukkan kartu ke kontainer yang tepat: income → incomeList, expense → expenseList
 */

// TODO [Basic] Tambahkan event listener 'submit' pada form, panggil e.preventDefault() di dalamnya
// TODO [Basic] Di dalam handler submit, ambil nilai input lalu tambahkan sebagai objek transaksi baru ke array
/**
 * Event ketika user menekan tombol submit.
 *
 * @param {SubmitEvent} event
 */
function handleSubmit(event) {
  event.preventDefault();

  if (editTransactionId === null) {
    addTransaction();
  } else {
    updateTransaction();
  }
}

/**
 * Refresh data state setiap ada perubahan
 */
function refresh() {
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

/**
 * Render data transaction dari storage dengan parameter keyword untuk search input
 * @param {string} keyword
 */
function renderTransactions(keyword = '') {
  elements.incomeList.innerHTML = '';
  elements.expenseList.innerHTML = '';

  for (const t of transactions) {
    if (keyword && !t.title.toLowerCase().includes(keyword)) {
      continue;
    }

    const element = createTransactionElement(t);

    if (t.type === 'income') {
      elements.incomeList.append(element);
    } else {
      elements.expenseList.append(element);
    }
  }
}

/**
 * Membuat satu elemen HTML Transaction.
 *
 * @param {{
 *   id: number,
 *   title: string,
 *   amount: number,
 *   date: string,
 *   type: 'income' | 'expense'
 * }} transaction
 *
 * @returns {HTMLDivElement}
 */
function createTransactionElement(transaction) {
  // Container
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'transactionItem');
  container.classList.add('tracker-transaction-item');

  const icon = document.createElement('div');

  icon.classList.add('tracker-transaction-item__icon');

  if (transaction.type === 'income') {
    icon.classList.add('tracker-transaction-item__icon--income');
    icon.innerText = '💰';
  } else {
    icon.classList.add('tracker-transaction-item__icon--expense');
    icon.innerText = '💸';
  }

  // Title
  const title = document.createElement('h3');
  title.setAttribute('data-testid', 'transactionItemTitle');
  title.innerText = transaction.title;
  title.classList.add('tracker-transaction-item__title');

  // Amount
  const amount = document.createElement('p');
  amount.setAttribute('data-testid', 'transactionItemAmount');
  amount.innerText = `Rp. ${transaction.amount.toLocaleString('id-ID')}`;
  amount.classList.add('tracker-transaction-item__amount');

  if (transaction.type === 'income') {
    amount.classList.add('tracker-transaction-item__amount--income');
  } else {
    amount.classList.add('tracker-transaction-item__amount--expense');
  }

  // Date
  const date = document.createElement('p');
  date.setAttribute('data-testid', 'transactionItemDate');
  date.innerText = `Tanggal: ${transaction.date}`;
  date.classList.add('tracker-transaction-item__date');

  // Type
  const type = document.createElement('p');
  type.setAttribute('data-testid', 'transactionItemType');
  type.innerText = `Tipe: ${
    transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'
  }`;
  type.setAttribute('hidden', true);

  // Button Container
  const buttonContainer = document.createElement('div');

  // Edit Type Button
  const editTypeButton = document.createElement('button');
  editTypeButton.setAttribute('data-testid', 'transactionItemEditTypeButton');
  editTypeButton.innerText = 'Ubah Tipe';
  editTypeButton.classList.add('tracker-transaction-item__btn');

  editTypeButton.addEventListener('click', () => {
    toggleTransactionType(transaction.id);
  });

  // Edit Button
  const editButton = document.createElement('button');
  editButton.setAttribute('data-testid', 'transactionItemEditButton');
  editButton.innerText = 'Edit';
  editButton.classList.add('tracker-transaction-item__btn');

  editButton.addEventListener('click', () => {
    editTransaction(transaction.id);
  });

  // Delete Button
  const deleteButton = document.createElement('button');
  deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteButton.innerText = 'Hapus';
  deleteButton.classList.add('tracker-transaction-item__btn');

  deleteButton.addEventListener('click', () => {
    deleteTransaction(transaction.id);
  });

  // const content = document.createElement('div');
  // content.classList.add('tracker-transaction-item__content');

  // content.append(title, date, type);

  const detail = document.createElement('div');
  detail.classList.add('tracker-transaction-item__detail');

  detail.append(title, date, type);

  const right = document.createElement('div');
  right.classList.add('tracker-transaction-item__right');

  const actions = document.createElement('div');
  actions.classList.add('tracker-transaction-item__actions');

  actions.append(editTypeButton, editButton, deleteButton);

  right.append(amount, actions);

  container.append(icon, detail, right);

  return container;
}

/**
 * TODO [Skilled]:
 * Tambahkan validasi input sebelum menyimpan data:
 *  - Tampilkan alert() dan hentikan proses jika judul kosong
 *  - Tampilkan alert() dan hentikan proses jika nominal kurang dari 1
 */
/**
 * Memvalidasi data transaksi sebelum disimpan.
 *
 * @param {string} title - Judul transaksi.
 * @param {number} amount - Nominal transaksi.
 * @param {string} date - Tanggal Transaksi..
 * @returns {boolean} true jika valid, false jika tidak valid.
 */
function validateTransaction(title, amount, date) {
  if (title.trim() === '') {
    showError('Judul transaksi wajib diisi!');
    return false;
  }

  if (amount < 1) {
    showError('Nominal transaksi harus lebih dari 0!');
    return false;
  }

  if (date === '') {
    showError('Tanggal wajib diisi');
    return false;
  }

  return true;
}
/**
 * TODO [Advanced]:
 * Setiap kali data transaksi berubah, perbarui Panel Dasbor:
 *  - Hitung total pemasukan, total pengeluaran, dan saldo (pemasukan - pengeluaran)
 *  - Tampilkan hasilnya ke elemen yang sesuai di HTML
 */

/**
 * Menghitung ringkasan transaksi.
 *
 * @returns {{
 * income:number,
 * expense:number,
 * balance:number
 * }}
 */
function calculateSummary() {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * Memperbarui dashboard.
 */
function updateDashboard() {
  const summary = calculateSummary();

  elements.totalIncome.innerText = `Rp. ${summary.income.toLocaleString('id-ID')}`;
  elements.totalExpense.innerText = `Rp. ${summary.expense.toLocaleString('id-ID')}`;
  elements.balance.innerText = `Rp. ${summary.balance.toLocaleString('id-ID')}`;
}
/**
 * ========================================================
 * Kriteria 2: Mengelola Penyimpanan Data (Web Storage API)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Data transaksi disimpan ke localStorage menggunakan JSON.stringify(), dan dimuat kembali saat halaman dibuka menggunakan JSON.parse().
 *  - Tombol "Hapus" berfungsi: transaksi yang dihapus langsung hilang dari layar dan dari localStorage.
 */

/**
 * Menambah transaction ke state.
 *
 */
function addTransaction() {
  const { title, amount, date, type } = getTransactionFormData();

  if (!validateTransaction(title, amount, date)) {
    return;
  }

  const transaction = createTransactionObject(
    generateUniqueId(),
    title,
    amount,
    date,
    type,
  );

  transactions.push(transaction);

  showSuccess();

  refresh();
}

/**
 * Menghapus transaction dari state.
 *
 * @param {Number} id
 */
async function deleteTransaction(id) {
  const index = findTransactionIndex(id);

  if (index === -1) return;

  const confirm = await showConfirm('Do You Want To Delete This Transaction?');

  if (confirm) {
    transactions.splice(index, 1);
    refresh();
  }
}
/**
 * TODO [Skilled]:
 * Tombol "Edit" berfungsi: saat ditekan, formulir (#transactionForm) secara otomatis terisi dengan data transaksi yang dipilih.
 *  - Pengguna dapat mengubah data lalu menyimpan perubahan.
 *  - Formulir kembali ke mode "Tambah" setelah pembaruan selesai.
 */

/**
 * Mengisi form dengan data transaction yang akan diedit.
 *
 * @param {number} id
 */
function editTransaction(id) {
  const transaction = findTransaction(id);

  if (!transaction) return;

  document.getElementById('transactionFormTitleInput').value =
    transaction.title;

  document.getElementById('transactionFormAmountInput').value =
    transaction.amount;

  document.getElementById('transactionFormDateInput').value = transaction.date;

  document.getElementById('transactionFormTypeSelect').value = transaction.type;

  editTransactionId = id;

  elements.submitButton.innerText = 'Update';
}

/**
 * Memperbarui data transaksi.
 */
function updateTransaction() {
  const transaction = findTransaction(editTransactionId);

  if (!transaction) return;

  const { title, amount, date, type } = getTransactionFormData();

  if (!validateTransaction(title, amount, date)) {
    return;
  }

  transaction.title = title;
  transaction.amount = amount;
  transaction.date = date;
  transaction.type = type;

  resetForm();

  refresh();

  showSuccess('Transaction Updated');
}

/**
 * Mengembalikan form ke mode tambah.
 */
function resetForm() {
  document.getElementById('transactionForm').reset();

  editTransactionId = null;

  elements.submitButton.innerText = 'Simpan';
}
/**
 * TODO [Advanced]:
 * Gunakan Custom Event sebagai penghubung antara perubahan data dan pembaruan tampilan:
 *  - Kirim sinyal dengan document.dispatchEvent(new Event('transaction:updated')) setiap kali data berubah
 *  - Pasang satu listener untuk event tersebut yang memanggil fungsi render dan update dasbor
 */

/**
 * ========================================================
 * Kriteria 3: Fitur Interaktif (Pindah Kategori dan Pencarian)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Tambahkan tombol "Ubah Tipe" pada setiap kartu transaksi:
 *  - Saat diklik, ubah tipe transaksi: 'income' → 'expense' atau 'expense' → 'income'
 *  - Simpan perubahan ke localStorage dan perbarui tampilan
 */

/**
 * Fungsi update tipe transaksi di state
 *
 * @param {Number} id
 */
async function toggleTransactionType(id) {
  const transaction = findTransaction(id);

  if (!transaction) return;

  const confirm = await showConfirm(
    'Do you want to change this transaction type?',
  );

  if (!confirm) return;

  transaction.type = transaction.type === 'income' ? 'expense' : 'income';

  refresh();
}

/**
 * TODO [Skilled]:
 * Tambahkan event listener 'input' pada kolom pencarian:
 *  - Filter array transaksi berdasarkan kecocokan kata kunci dengan judul transaksi
 *  - Tampilkan hanya transaksi yang judulnya mengandung kata kunci tersebut
 */

/**
 * Event ketika user menekan tombol submit.
 *
 * @param {SubmitEvent} event
 */
function handleSearch(event) {
  event.preventDefault();

  const keyword = event.target.value.trim().toLowerCase();
  renderTransactions(keyword);
}

/**
 * TODO [Advanced]:
 * Pastikan fitur pencarian berjalan dengan baik di semua kondisi:
 *  - Saat kolom pencarian dikosongkan, tampilkan kembali seluruh daftar transaksi
 */

/**
 * Mengecek apakah browser mendukung LocalStorage.
 *
 * @returns {boolean}
 */
function isStorageExist() {
  return typeof Storage !== 'undefined';
}

/**
 * Menyimpan seluruh data Transactions ke LocalStorage.
 */
function saveData() {
  if (!isStorageExist()) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

  document.dispatchEvent(new Event(SAVED_EVENT));
}

/**
 * Mengambil data Transactions dari LocalStorage.
 */
function loadDataFromStorage() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (!data) return;

  transactions.push(...data);

  refresh();
}

/**
 *
 * @returns {{
 * title:string,
 * amount:number,
 * date:string
 * type:string
 * }}
 */
function getTransactionFormData() {
  return {
    title: document.getElementById('transactionFormTitleInput').value,
    amount: Number(document.getElementById('transactionFormAmountInput').value),
    date: document.getElementById('transactionFormDateInput').value,
    type: document.getElementById('transactionFormTypeSelect').value,
  };
}

/**
 * Helper toastify untuk success message
 */
function showSuccess(text) {
  Toastify({
    text: (text = text ? text : 'Data Saved'),
    duration: 3000,
    // destination: 'https://github.com/apvarun/toastify-js',
    // newWindow: true,
    close: true,
    gravity: 'top', // `top` or `bottom`
    position: 'center', // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: 'linear-gradient(to right, #00b09b, #96c93d)',
    },
    // onClick: function () {}, // Callback after click
  }).showToast();
}

/**
 * Helper sweetAlert2 untuk error message
 *
 * @param {String} text
 */
function showError(text) {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text,
  });
}

/**
 * Helper sweetAlert2 untuk warn message
 */
async function showWarning() {
  const result = await Swal.fire({
    title: 'Do you want to update this data',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
  });

  return result.isConfirmed;
}

/**
 * Helper sweetAlert2 untuk confirm message
 *
 * @param {String} title
 * @returns {Boolean}
 */
async function showConfirm(title) {
  const result = await Swal.fire({
    title,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
  });

  return result.isConfirmed;
}
