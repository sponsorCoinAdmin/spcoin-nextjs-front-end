import React from "react";

function Title() {
  function upDateTitle (titleName: string){
    let titleDiv = document.getElementById("titleName");
    alert("EXECUTING: upDateTitle (titleName");
    if (titleDiv != null) {
      titleDiv.innerHTML = titleName;
    }
    else {

    }
  }

  return (
    <div className ="titleName">
      <h1 id="titleId">Title</h1>
    </div>
  );
}

export default Title;
