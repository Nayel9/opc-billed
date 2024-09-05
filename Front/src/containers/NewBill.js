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
  fileValidation = file => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png'];
    const fileInput = document.querySelector(`input[data-testid="file"]`);
    if (!validExtensions.includes(fileExtension)) {
      alert('Veuillez sélectionner un type de fichier valide : jpg, jpeg ou png');
      fileInput.value = ''; // Réinitialiser l'entrée de fichier
      this.document
          .querySelector(`input[data-testid="file"]`)
          .classList.add("is-invalid");
      return false;
    } else {
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
    const file = this.document.querySelector(`input[data-testid="file"]`)
        .files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    this.fileValidation(file) &&
    this.store // Si type de fichier incorrect, on ne l'envoie pas vers le store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch(error => console.error(error));
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
    if (this.store) {
      this.store
          .bills()
          .update({ data: JSON.stringify(bill), selector: this.billId })
          .then(() => {
            this.onNavigate(ROUTES_PATH["Bills"]);
          })
          .catch(error => console.error(error));
    }
  };
}