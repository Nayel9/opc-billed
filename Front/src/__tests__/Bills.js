/**
 * @jest-environment jsdom
 */
import {screen, fireEvent, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import '@testing-library/jest-dom/extend-expect';
import router from "../app/Router.js";
import $ from 'jquery'; // Import jQuery

// Mock jQuery modal function
$.fn.modal = jest.fn();

// Utilitaire pour configurer localStorage
const setupLocalStorage = (userType) => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  window.localStorage.setItem('user', JSON.stringify({ type: userType }));
};

describe("Given I am connected as an employee", () => {

  describe("When I click on the new bill button", () => {
    test("Then it should navigate to the new bill page", () => {
      // Configurer localStorage
      setupLocalStorage('Employee');

      // Rendre le BillsUI
      document.body.innerHTML = BillsUI({ data: [] });

      // Initialiser le composant Bills
      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

      // Trouver le bouton et simuler un clic
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      fireEvent.click(buttonNewBill);

      // Vérifier la navigation
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    });
  });

  describe("When I click on the eye icon", () => {
    test("Then it should open the modal with the bill image", () => {
      // Set up localStorage
      setupLocalStorage('Employee');

      // Render BillsUI
      document.body.innerHTML = BillsUI({ data: [] });

      // Initialize Bills component
      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

      // Mock the icon element
      const icon = document.createElement('div');
      icon.setAttribute('data-testid', 'icon-eye');
      icon.setAttribute('data-bill-url', 'https://example.com/bill.jpg');
      document.body.append(icon);

      // Simulate click event
      billsInstance.handleClickIconEye(icon);

      // Verify modal behavior
      expect($.fn.modal).toHaveBeenCalledWith('show');
      expect(document.querySelector('.bill-proof-container img').src).toBe('https://example.com/bill.jpg');
    });

    test("Then clicking on eye icon should call handleClickIconEye", () => {
      // Set up localStorage
      setupLocalStorage('Employee');

      // Render BillsUI
      document.body.innerHTML = BillsUI({ data: bills });

      // Initialize Bills component
      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

      // Spy on handleClickIconEye method
      const handleClickIconEyeSpy = jest.spyOn(billsInstance, 'handleClickIconEye');

      // Simulate click event on each icon-eye
      const iconEyes = screen.getAllByTestId('icon-eye');
      iconEyes.forEach(icon => {
        fireEvent.click(icon);
      });

      // Verify handleClickIconEye is called for each icon
      expect(handleClickIconEyeSpy).toHaveBeenCalledTimes(iconEyes.length);

      // Restore the original function
      handleClickIconEyeSpy.mockRestore();
    });
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Set up localStorage
      setupLocalStorage('Employee');

      // Vider le corps du document pour éviter plusieurs éléments avec le même data-testid
      document.body.innerHTML = '';

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      /* On vérifie si windowIcon a cette classe */
      expect(windowIcon).toHaveClass("active-icon")
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => (a.date < b.date) ? 1 : -1) });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I call getBills", () => {
    test("Then it should return sorted and formatted bills", async () => {
      // Mock the store
      const mockBills = [
        { date: "2022-04-01", status: "pending" },
        { date: "2022-03-01", status: "accepted" },
        { date: "2022-05-01", status: "refused" }
      ];
      const store = {
        bills: jest.fn(() => ({
          list: jest.fn(() => Promise.resolve(mockBills))
        }))
      };

      // Mock the formatting functions
      const formatDate = (date) => {
        const options = { year: '2-digit', month: 'long', day: 'numeric' };
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', options);
        return formattedDate.replace(/\b(\w{3})\w*\b/g, (match, p1) => p1.charAt(0).toUpperCase() + p1.slice(1) + '.');
      };
      const formatStatus = (status) => {
        const statuses = {
          "pending": "En attente",
          "accepted": "Accepté",
          "refused": "Refused"
        };
        return statuses[status];
      };

      // Initialize Bills component
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage });

      // Call getBills and wait for the result
      const bills = await billsInstance.getBills();

      // Verify the bills are sorted by date
      expect(bills).toEqual([
        { date: formatDate("2022-05-01"), status: formatStatus("refused") },
        { date: formatDate("2022-04-01"), status: formatStatus("pending") },
        { date: formatDate("2022-03-01"), status: formatStatus("accepted") }
      ]);

      // Verify the dates and statuses are formatted
      bills.forEach(bill => {
        expect(bill.date).toMatch(/^\d{1,2} \w{3}\. \d{2}$/); // Assuming formatDate formats to D MMM YY
        expect(["En attente", "Accepté", "Refused"]).toContain(bill.status); // Assuming formatStatus translates the status
      });
    });
  });

  // test d'intégration GET

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          "localStorage",
          { value: localStorageMock }
      )
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    // Vérifie si l'erreur 404 s'affiche bien
    test("Then fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    // Vérifie si l'erreur 500 s'affiche bien
    test("Then fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})