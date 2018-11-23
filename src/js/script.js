'use strict';
var $ = require('../../node_modules/jquery');


$(function() {
  $("document").ready(function(){
    $(".tab-slider--body").hide();
    $(".tab-slider--body:first").show();
  });

  $(".tab-slider--nav li").click(function() {
    $(".tab-slider--body").hide();
    var activeTab = $(this).attr("rel");
    $("#"+activeTab).fadeIn();
      if($(this).attr("rel") == "tab2"){
          $('.tab-slider--tabs').addClass('slide');
      }else{
          $('.tab-slider--tabs').removeClass('slide');
      }
    $(".tab-slider--nav li").removeClass("active");
    $(this).addClass("active");
  });

  function fade(a) {
    $("." + a).each(function(){
      var imgPos = $(this).offset().top;
      var scroll = $(window).scrollTop();
      var windowHeight = $(window).height();
      var b = a + "-active";
      if (scroll > imgPos - windowHeight + windowHeight/5){
        $(this).addClass(b);
      }
    });
  }

  $(window).on("load scroll", function(){
    fade("u-fade-up");
  });

});
