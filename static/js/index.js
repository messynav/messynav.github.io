window.HELP_IMPROVE_VIDEOJS = false;

$(document).ready(function () {
  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(function () {
    // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  var options = {
    slidesToScroll: 1,
    slidesToShow: 3,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  };

  // Initialize all div with carousel class
  bulmaCarousel.attach(".carousel", options);

  bulmaSlider.attach();

  // Reveal the section nav once the abstract is reached, and keep it
  // visible for everything below it.
  var nav = document.querySelector(".messynav-navbar");
  var abstract = document.getElementById("abstract");
  if (nav && abstract && "IntersectionObserver" in window) {
    // rootMargin shrinks the observation area to a band at the very top of
    // the viewport, so the nav appears when the abstract reaches the top of
    // the screen -- not the moment it peeks in from the bottom.
    var observer = new IntersectionObserver(
      function (entries) {
        var e = entries[0];
        var reached = e.isIntersecting || e.boundingClientRect.top < 0;
        nav.classList.toggle("is-visible", reached);
      },
      { rootMargin: "0px 0px -90% 0px" }
    );
    observer.observe(abstract);
  } else if (nav) {
    // No IntersectionObserver: leave the nav permanently visible.
    nav.classList.add("is-visible");
  }
});
