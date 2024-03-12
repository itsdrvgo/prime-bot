let wrapper = document.querySelector(".wrapper")
let navHead = document.querySelector(".navhead")

wrapper.addEventListener("scroll", (e) => {
    if (wrapper.scrollTop > 800) {
        navHead.classList.add("colored")
    }
    if (wrapper.scrollTop < 800) {
        navHead.classList.remove("colored")
    }

})