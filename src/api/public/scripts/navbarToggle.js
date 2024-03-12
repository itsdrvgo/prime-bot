let menuExpander = document.querySelector("#menu_icon")
let navbar = document.querySelector(".navbar")

menuExpander.addEventListener("click", () => {

    menuExpander.classList.toggle("bx-x")
    navbar.classList.toggle("open")

})