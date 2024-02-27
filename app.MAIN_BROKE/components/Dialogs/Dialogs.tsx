import AgentDialog from './AgentDialog';
import RecipientDialog from './RecipientDialog';
import SellTokenDialog from './SellTokenDialog';
import BuyTokenDialog from './BuyTokenDialog';
import ErrorDialog from './ErrorDialog';

// --------------------------- END NEW MODAL/DIALOG CODE -----------------------------------------------------
const openDialog = (dialogType:string) => {
    let dialog:any = document.querySelector(dialogType)
    dialog.showModal();
  }


export {
    openDialog,
    AgentDialog,
    RecipientDialog, 
    SellTokenDialog,
    BuyTokenDialog,
    ErrorDialog
}