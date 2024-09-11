/// START DROPDOWN STUFF
const hideElement = (element: string) => {
  const el = document.getElementById(element);
  // console.debug("hideElement(" + element +")")
  if (el != null) {
    el.style.display = 'none';
  }
};

const showElement = (element: string) => {
  const el = document.getElementById(element);
  // console.debug("showElement(" + element + ")");
  if (el != null) {
    el.style.display = 'block';
  }
};

const toggleElement = (element: any) => {
  const el = document.getElementById(element);
  if (el != null) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
};

export {
  hideElement,
  showElement,
  toggleElement
}