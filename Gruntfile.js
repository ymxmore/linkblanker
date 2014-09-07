module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
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
	    qunit: {
    		files: ['test/**/*.html']
		},
	    jshint: {
			files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
		},
		watch: {
			javascripts: {
		    	files: ['<%= jshint.files %>'],
		    	// tasks: ['jshint', 'qunit']
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

	grunt.registerTask('init', function() {
		grunt.task.run('clean');

		for (var target in grunt.config.data.watch) {
			grunt.task.run(grunt.config.data.watch[target].tasks);
		}
	});

	grunt.registerTask('test',    ['jshint', 'qunit']);
	grunt.registerTask('build',   ['jshint', 'clean', 'compass:production','uglify:production', 'image', 'htmlmin']);

	for (var task in grunt.file.readJSON('package.json').devDependencies) {
		if (task.substring(0, 6) == 'grunt-') {
	    	grunt.loadNpmTasks(task);
		}
	}
};
