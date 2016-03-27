cat src/js/tenuki.js $(find src/js -name "*.js" -a ! -name "tenuki.js") > build/tenuki.js
cat src/css/*.css > build/tenuki.css
