
<!DOCTYPE html>
<html lang="en"> 
<head>
    <meta charset="UTF-8">
    <meta name="theme-color" content="#fff" />
    <meta property="og:title" content="Birdhunter by TND Studio">
    <meta property="og:description" content="Birdhunter The Ultimate Game Experience! Join us on │https://discord.gg/bugwH4wmt4│ for the latest updates.">
    <meta property="og:image" content="https://flappybirdsequel.pages.dev/clappy.png">
    <meta property="og:url" content="https://flappybirdsequel.pages.dev/">
    <meta property="og:type" content="website">
    <title>Birdhunter The Ultimate Game Experience</title>
    <meta name="author" content="TND Studio™">
    
    <style>
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            overflow: hidden;
        }
        .hello-message {
            margin: 20px;
            text-align: center;
        }
        .logout-messages {
            pointer-events: none;
            color: red;
            margin: 40px;
            position: fixed;
            top: 0;
            left: 0;
            text-shadow: 2px 2px #ffffff, 4px 4px 10px #4d4c4c;
        }
        img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -1;
        }
        @keyframes blurslowly {
            0% { filter: none; }
            92% { filter: blur(0); }
            96% { filter: blur(1px); }
            100% { filter: blur(0); }
        }
        body {
            animation-name: blurslowly;
            animation-iteration-count: infinite;
            animation-duration: 15s;
            animation-play-state: running;
        }
        .header, .map-container {
            display: none;
        }
    </style>

    <template>
        <div class="hello-message">
            <img src="background-img.png" alt="Play" />
        </div>
        <div class="logout-messages"></div>
    </template>
    
<header class="header"></header>

<script src="/index.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-3898076-24"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'UA-3898076-24');
</script>
<script src="./config.js"></script>

</head>
<body>
    <header class="header"></header>
    <script src="./config.js"></script>
    <style>
      .header {
        display: none
      }
      .map-container {
        display: none
      }
    </style>
</body>
</html>
<!-- Favicon -->
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">




