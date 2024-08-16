import AgentDialog from './AgentDialog';
import BuyTokenSelectDialog from './BuyTokenSelectDialog';
import Config from './ConfigDialog';
import ErrorDialog from './ErrorDialog';
import RecipientDialog from './RecipientDialog';
import SellTokenSelectDialog from './SellTokenSelectDialog';

// --------------------------- END NEW MODAL/DIALOG CODE -----------------------------------------------------
const openDialog = (dialogType:string) => {
    let dialog:any = document.querySelector(dialogType)
    dialog.showModal();
  }

export {
    openDialog,
    AgentDialog,
    Config,
    RecipientDialog, 
    SellTokenSelectDialog,
    BuyTokenSelectDialog,
    ErrorDialog
}