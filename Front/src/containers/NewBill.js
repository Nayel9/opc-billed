import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

/**
 * Classe représentant une nouvelle facture.
 */
export default class NewBill {
  /**
   * Crée une nouvelle facture.
   * @param {Object} param0 - Les paramètres.
   * @param {Document} param0.document - L'objet document.
   * @param {Function} param0.onNavigate - La fonction de navigation.
   * @param {Object} param0.store - L'objet store.
   * @param {Object} param0.localStorage - L'objet localStorage.
   */
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
        `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  /**
   * Valide le type de fichier.
   * @param {File} file - Le fichier à valider.
   * @returns {boolean} - Retourne true si le fichier est valide, sinon false.
   */
/**
 * Valide le type de fichier.
 * @param {File} file - Le fichier à valider.
 * @returns {boolean} - Retourne true si le fichier est valide, sinon false.
 */
fileValidation = file => { //bug report bills résolu
  const fileExtension = file.name.split('.').pop().toLowerCase();
  // Liste des extensions de fichiers valides
  const validExtensions = ['jpg', 'jpeg', 'png'];
  const fileInput = document.querySelector(`input[data-testid="file"]`);
  // Vérifie si l'extension du fichier est valide
  if (!validExtensions.includes(fileExtension)) {
    // Affiche une alerte si le fichier n'est pas valide
    alert('Veuillez sélectionner un type de fichier valide : jpg, jpeg ou png');
    fileInput.value = '';
    // Ajoute une classe d'erreur à l'input de fichier
    this.document
        .querySelector(`input[data-testid="file"]`)
        .classList.add("is-invalid");
    return false;
  } else {
    // Retire la classe d'erreur si le fichier est valide
    this.document
      .querySelector(`input[data-testid="file"]`)
      .classList.remove("is-invalid");
    return true;
  }
};

/**
 * Gère l'événement de changement de fichier.
 * @param {Event} e - L'objet événement.
 */
handleChangeFile = async e => {
  e.preventDefault();
  // Récupère le fichier sélectionné
  const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
  // Récupère le chemin du fichier et le nom du fichier
  const filePath = e.target.value.split(/\\/g);
  const fileName = filePath[filePath.length - 1];
  // Crée un objet FormData pour le fichier
  const formData = new FormData();
  // Récupère l'email de l'utilisateur depuis le localStorage
  const email = JSON.parse(localStorage.getItem("user")).email;
  // Ajoute le fichier et l'email à l'objet FormData
  formData.append("file", file);
  formData.append("email", email);
    // Valide le type de fichier avant de continuer
    this.fileValidation(file) &&
    // Si le type de fichier est valide, continue à créer une nouvelle facture dans le store
    this.store
      .bills()
      .create({
        data: formData, // Données du formulaire contenant le fichier et l'email de l'utilisateur
        headers: {
          noContentType: true, // Pas d'en-tête de type de contenu pour le téléchargement de fichier
        },
      })
      .then(({ fileUrl, key }) => {
        // En cas de création réussie, stocke l'URL du fichier et l'ID de la facture
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch(error => console.error(error)); // Enregistre toute erreur survenue lors du processus de création
  };

  /**
   * Gère l'événement de soumission du formulaire.
   * @param {Event} e - L'objet événement.
   */
  handleSubmit = e => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
          e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
          parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
          20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
          .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    if (!this.fileName) return;
    //Si pas de fichier selectionné, submit impossible
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  /**
   * Met à jour la facture.
   * @param {Object} bill - L'objet facture.
   */
  updateBill = bill => {
    // Vérifie si l'objet store est défini
    if (this.store) {
      // Met à jour la facture dans le store
      this.store
          .bills()
          .update({ data: JSON.stringify(bill), selector: this.billId })
          .then(() => {
            // Redirige vers la page des factures après la mise à jour réussie
            this.onNavigate(ROUTES_PATH["Bills"]);
          })
          .catch(error => console.error(error)); // Enregistre toute erreur survenue lors du processus de mise à jour
    }
  };
}