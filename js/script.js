var lnStickyNavigation;

$(document).ready(function()
{	
    applyHeader();
    applyNavigation(); 
    applyMailTo();
    applyResize();
    checkHash();
    checkBrowser();
});

/* HEADER FUNCTIONS */

function applyHeader()
{
    $('.jumbotron').css({ height: ($(window).height()) +'px' });

    lazyLoad($('.jumbotron'));
}	

function lazyLoad(poContainer)
{
    /*var lstrSource   = poContainer.attr('data-src');
    var lstrPosition = poContainer.attr('data-position');

    $('<img>').attr('src', lstrSource).load(function()
    {
            poContainer.css('background-image', 'url("'+ lstrSource +'")');
            poContainer.css('background-position', lstrPosition);
            poContainer.css('-ms-filter', '"progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + lstrSource + '\', sizingMethod=\'scale\')"');
            poContainer.css('filter', 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + lstrSource + '\', sizingMethod=\'scale\'');
    });*/
}

/* NAVIGATION FUNCTIONS */

function applyNavigation()
{
    applyClickEvent();
    applyNavigationFixForPhone();
    applyScrollSpy();
    applyStickyNavigation();
}

function applyClickEvent()
{
    $('a[href*=#]').on('click', function(e)
    {
        e.preventDefault();

        if( $( $.attr(this, 'href') ).length > 0 )
        {
            $('html, body').animate(
            {
                scrollTop: $( $.attr(this, 'href') ).offset().top
            }, 400);
        }
        return false;
    });
}

function applyNavigationFixForPhone()
{
    $('.navbar li a').click(function(event) 
    {
        $('.navbar-collapse').removeClass('in').addClass('collapse');
    });
}

function applyScrollSpy()
{
    $('#navbar-example').on('activate.bs.scrollspy', function() 
    {
        window.location.hash = $('.nav .active a').attr('href').replace('#', '#/');
    });
}

function applyStickyNavigation()
{
    lnStickyNavigation = $('.scroll-down').offset().top + 20;

    $(window).on('scroll', function() 
    {  
        stickyNavigation();  
    });  

    stickyNavigation();
}

function stickyNavigation()
{         
    if($(window).scrollTop() > lnStickyNavigation) 
    {   
        $('body').addClass('fixed');  
    } 
    else 
    {  
        $('body').removeClass('fixed');   
    }  
}

/* RESIZE FUNCTION */

function applyResize()
{
    $(window).on('resize', function() 
    {  
        lnStickyNavigation = $('.scroll-down').offset().top + 20;

        $('.jumbotron').css({ height: ($(window).height()) +'px' });
    }); 
}

/* HASH FUNCTION */

function checkHash()
{
    lstrHash = window.location.hash.replace('#/', '#');

    if($('a[href='+ lstrHash +']').length > 0)
    {
        $('a[href='+ lstrHash +']').trigger('click');
    }
}

/* IE7- FALLBACK FUNCTIONS */

function checkBrowser()
{
    var loBrowserVersion = getBrowserAndVersion();

    if(loBrowserVersion.browser == 'Explorer' && loBrowserVersion.version < 8)
    { 
        $('#upgrade-dialog').modal({
            backdrop: 'static',
            keyboard: false
        });
    }
}

function getBrowserAndVersion() 
{
    var laBrowserData = [{
        string: navigator.userAgent,
        subString: 'MSIE',
        identity: 'Explorer',
        versionSearch: 'MSIE'
    }];

    return {
        browser: searchString(laBrowserData) || 'Modern Browser',
        version: searchVersion(navigator.userAgent) || searchVersion(navigator.appVersion) || '0.0'
    };
}

function searchString(paData) 
{
    for(var i = 0; i < paData.length; i++)	
    {
        var lstrDataString 	= paData[i].string;
        var lstrDataProp = paData[i].prop;

        this.versionSearchString = paData[i].versionSearch || paData[i].identity;

        if(lstrDataString) 
        {
            if(lstrDataString.indexOf(paData[i].subString) != -1)
            {
                return paData[i].identity;
            }
        }
        else if(lstrDataProp)
        {
            return paData[i].identity;
        }
    }
}
	
function searchVersion(pstrDataString) 
{
    var lnIndex = pstrDataString.indexOf(this.versionSearchString);

    if(lnIndex == -1) 
    {
        return;
    }

    return parseFloat(pstrDataString.substring(lnIndex + this.versionSearchString.length + 1));
}	

$(window).on("load",function() {
  $(window).scroll(function() {
    var windowBottom = $(this).scrollTop() + $(this).innerHeight();
    $(".fade").each(function() {
      /* Check the location of each desired element */
      var objectBottom = $(this).offset().top + $(this).outerHeight();
      
      /* If the element is completely within bounds of the window, fade it in */
      if (objectBottom < windowBottom + 500) { //object comes into view (scrolling down)
        if ($(this).css("opacity")==0) {$(this).fadeTo(400,1);}
      } else { //object goes out of view (scrolling up)
        if ($(this).css("opacity")==1) {$(this).fadeTo(400,0);}
      }
    });
  }).scroll(); //invoke scroll-handler on page-load
});


// toggle menu
var theToggle = document.getElementById('toggle');

// based on Todd Motto functions
// https://toddmotto.com/labs/reusable-js/

// hasClass
function hasClass(elem, className) {
	return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
}
// addClass
function addClass(elem, className) {
    if (!hasClass(elem, className)) {
    	elem.className += ' ' + className;
    }
}
// removeClass
function removeClass(elem, className) {
	var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ') + ' ';
	if (hasClass(elem, className)) {
        while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
            newClass = newClass.replace(' ' + className + ' ', ' ');
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
}
// toggleClass
function toggleClass(elem, className) {
	var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, " " ) + ' ';
    if (hasClass(elem, className)) {
        while (newClass.indexOf(" " + className + " ") >= 0 ) {
            newClass = newClass.replace( " " + className + " " , " " );
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    } else {
        elem.className += ' ' + className;
    }
}

theToggle.onclick = function() {
   toggleClass(this, 'on');
   return false;
}

// back to top button
var btn = $('#button');

$(window).scroll(function() {
  if ($(window).scrollTop() > 300) {
    btn.addClass('show');
  } else {
    btn.removeClass('show');
  }
});

btn.on('click', function(e) {
  e.preventDefault();
  $('html, body').animate({scrollTop:0}, '300');
});