import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from "../app/format.js"
import Logout from "./Logout.js"

/**
 * Classe représentant la gestion des factures.
 */
export default class {
  /**
   * Crée une instance de la classe.
   * @param {Object} param0 - Les paramètres de configuration.
   * @param {Document} param0.document - L'objet document.
   * @param {Function} param0.onNavigate - La fonction de navigation.
   * @param {Object} param0.store - L'objet store pour accéder aux données.
   * @param {Object} param0.localStorage - L'objet localStorage.
   */
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill)
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)
    if (iconEye) iconEye.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon))
    })
    new Logout({ document, localStorage, onNavigate })
  }

  /**
   * Gère le clic sur le bouton pour créer une nouvelle facture.
   */
  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill'])
  }

  /**
   * Gère le clic sur l'icône pour afficher la facture.
   * @param {Element} icon - L'élément icône cliqué.
   */
  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url")
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5)
    $('#modaleFile').find(".modal-body").html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`)
    $('#modaleFile').modal('show')
  }

  /**
   * Récupère les factures depuis le store.
   * @returns {Promise<Array>} Une promesse contenant la liste des factures.
   */
  getBills = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
            .sort((a, b) => (a.date < b.date) ? 1 : -1) //Bug report bills résolu : Tri par date décroissante
            .map(doc => {
            try {
              return {
                ...doc,
                date: formatDate(doc.date),
                status: formatStatus(doc.status)
              }
            } catch(e) {
              // En cas de données corrompues, on gère ici l'échec de la fonction formatDate
              // On enregistre l'erreur et on retourne la date non formatée dans ce cas
              console.log(e,'for',doc)
              return {
                ...doc,
                date: doc.date,
                status: formatStatus(doc.status)
              }
            }
          })
          console.log('length', bills.length)
        return bills
      })
    }
  }
}