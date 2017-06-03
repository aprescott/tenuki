PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

name := tenuki

source_js   := $(wildcard src/*.js)
compiled_js := $(source_js:src/%.js=lib/%.js)
bundled_js  := build/$(name).js build/$(name).min.js
bundled_css := build/$(name).css build/$(name).min.css

source_scss  := $(wildcard scss/*.scss)
compiled_css := $(source_scss:scss/%.scss=tmp/output-css/%.css)

.PHONY: all clean test

all: $(bundled_js) $(bundled_css)

clean:
	rm -rf build tmp lib

test: all
	npm test && eslint src

build/$(name).js: build $(compiled_js)
	cat copyright_header.txt \
		<(browserify index.js --standalone $(name) -t [ babelify --presets [ es2015 ] ]) \
		> $@

build/$(name).min.js: build/$(name).js
	cat copyright_header.txt \
		<(uglifyjs $< --mangle) \
		> $@

build/$(name).css: build $(compiled_css)
	cat copyright_header.txt \
		tmp/output-css/*.css \
		> $@

build/$(name).min.css: build/$(name).css
	cat copyright_header.txt \
		<(cat tmp/output-css/*.css | cleancss) \
		> $@

lib/%.js: src/%.js
	babel \
		--source-maps \
		--presets es2015 \
		--out-file $@ \
		$<

tmp/output-css/%.css: scss/%.scss
	node-sass \
		--output-style expanded \
		$< \
		> $@

lib:
	mkdir -p $@

build: lib tmp/output-css
	mkdir -p $@

tmp/output-css:
	mkdir -p $@
