module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	var manifest = grunt.file.readJSON("manifest.json");

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		'chrome-extension': {
            options: {
                name: "link-blanker-" + manifest.version,
                version: manifest.version,
                id: "lkafdfakakndhpcpccjnclopfncckhfn",
                chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                clean: true,
                buildDir: 'build',
                resources: [
                    "_locales/**",
                    "dest/**",
                    "vendor/**",
                    "LICENSE",
                    "manifest.json",
                    "README.md"
                ]
            }
        },
        gittag: {
            append: {
                options: {
                    tag: "v" + manifest.version,
                    message: "version " + manifest.version
                }
            }
        },
        gitpush: {
            tag: {
                options: {
                    tags: true
                }
            },
            master: {
                options: {
                    branch: "master"
                }
            }
        },
		uglify: {
	    	options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			development: {
	            src: 'src/javascripts/*.js',
	            dest: 'dest/javascripts/',
	            expand: true,
	            flatten: true,
	            beautify: true,
	            ext: '.min.js'
	    	},
	    	production: {
	            src: 'src/javascripts/*.js',
	            dest: 'dest/javascripts/',
	            expand: true,
	            flatten: true,
	            ext: '.min.js'
	    	}
	    },
		compass: {
			development: {
				options: {
					config: 'config.rb',
					environment: 'development',
					force: true
				}
			},
			production: {
				options: {
					config: 'config.rb',
					environment: 'production',
					force: true,
					cssDir: 'dest/stylesheets'
				}
			}
		},
	    image: {
	    	dynamic: {
	        	files: [{
	        		src: ['src/images/**/*.{png,jpg,gif,svg}'],
	        		dest: 'dest/images/',
	        		expand: true,
	        		flatten: true
	        	}]
	      	}
	    },
	    htmlmin: {
            all: {
                options: {
                    removeComments: true,
                    removeCommentsFromCDATA: true,
                    removeCDATASectionsFromCDATA: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    removeOptionalTags: true
                },
                expand: true,
                flatten: true,
                src: ['src/html/**/*.html'],
                dest: 'dest/html/'
            }
        },
        clean: ['dest/', 'build/'],
        copy: {
			javascripts: {
				files: [{
	        		cwd: 'src/',
	        		src: ['javascripts/*.js'],
	        		dest: 'dest/',
	        		expand: true,
	        		ext: '.min.js'
	        	}]
			},
			stylesheets: {
				files: [{
	        		cwd: 'src/',
	        		src: ['stylesheets/**'],
	        		dest: 'dest/',
	        		expand: true
	        	}]
			},
			image: {
				files: [{
	        		cwd: 'src/',
	        		src: ['images/**'],
	        		dest: 'dest/',
	        		expand: true
	        	}]
			},
			html: {
				files: [{
	        		cwd: 'src/',
	        		src: ['html/**'],
	        		dest: 'dest/',
	        		expand: true
	        	}]
			}
		},
	    jshint: {
			files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
		},
		watch: {
			javascripts: {
		    	files: ['<%= jshint.files %>'],
		    	tasks: ['jshint', 'copy:javascripts']
	    	},
	    	sass: {
	    		files: ['src/sass/*.scss'],
		    	tasks: ['compass:development', 'copy:stylesheets']
	    	},
	    	image: {
	    		files: ['src/images/*'],
		    	tasks: ['copy:image']
	    	},
	    	html: {
	    		files: ['src/html/*'],
		    	tasks: ['copy:html']
	    	}
	    }
	});

	grunt.registerTask('default', ['init', 'watch']);
	grunt.registerTask('test',    ['jshint']);
	grunt.registerTask('build',   ['jshint', 'clean', 'compass:production','uglify:production', 'image', 'htmlmin', 'chrome-extension']);

	grunt.registerTask('init', function() {
		grunt.task.run('clean');

		for (var target in grunt.config.data.watch) {
			grunt.task.run(grunt.config.data.watch[target].tasks);
		}
	});
};
