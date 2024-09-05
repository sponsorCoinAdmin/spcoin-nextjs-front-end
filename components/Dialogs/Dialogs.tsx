import AgentDialog from './AgentDialog';
import BuyTokenSelectDialog from './BuyTokenSelectDialog';
import Config from './ConfigDialog';
import ErrorDialog from './ErrorDialog';
import RecipientDialog from './RecipientDialog';
import TokenSelectDialog from './TokenSelectDialog';

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
    TokenSelectDialog,
    BuyTokenSelectDialog,
    ErrorDialog
}