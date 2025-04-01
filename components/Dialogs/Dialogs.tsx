import Config from './Popup/ConfigDialog';
import ErrorDialog from './ErrorDialog';
import RecipientDialog from './WalletSelectDialog';
import TokenSelectDialog from './AssetSelectDialog';

// --------------------------- END NEW MODAL/DIALOG CODE -----------------------------------------------------
const openDialog = (dialogType:string) => {
    let dialog:any = document.querySelector(dialogType)
    dialog.showModal();
  }

export {
    openDialog,
    Config,
    RecipientDialog, 
    TokenSelectDialog,
    ErrorDialog
}