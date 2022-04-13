window.onload=function(){
    
    document.getElementById("buttonTema").onclick=function(){
    var tema = localStorage.getItem("tema")
    if(tema)
        localStorage.removeItem("tema");
    else localStorage.setItem("tema", "dark");
    document.body.classList.toggle("dark");
}
}
