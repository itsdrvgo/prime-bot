$(".wrapper").scroll(() => {

    let scroll = $(".wrapper").scrollTop()
    $("#background").css({
        filter: "blur(" + (scroll / 50) + "px)"
    })

})