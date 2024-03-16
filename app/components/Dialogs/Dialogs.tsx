import AgentDialog from './AgentDialog';
import BuyTokenDialog from './BuyTokenDialog';
import Config from './ConfigDialog';
import ErrorDialog from './ErrorDialog';
import RecipientDialog from './RecipientDialog';
import SellTokenDialog from './SellTokenDialog';

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
    SellTokenDialog,
    BuyTokenDialog,
    ErrorDialog
}