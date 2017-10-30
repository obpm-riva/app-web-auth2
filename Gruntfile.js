/* global module, require */

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: require('./package.json'),

    browserify: {
      access: {
        src: ['./src/js/access/*.js'],
        dest: 'dist/v2/scripts/access-script.js'
      },
      reset: {
        src: ['./src/js/account/reset.js'],
        dest: 'dist/v2/scripts/reset-script.js'
      },
      register: {
        src: ['./src/js/account/register.js'],
        dest: 'dist/v2/scripts/register-script.js'
      },
      hub: {
        src: ['./src/js/account/hub.js'],
        dest: 'dist/v2/scripts/hub-script.js'
      }
    },

    copy: {
      all: {
        files: [
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['src/html/*.html'],
            dest: 'dist/v2/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['src/css/*.css'],
            dest: 'dist/v2/css'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['assets/**/*.*'],
            dest: 'dist/v2/assets'
          }
        ]
      }
    },

    watch: {
      all: {
        files: ['Gruntfile.js', 'locales.json', 'src/**/*.*'],
        tasks: ['default']
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['browserify', 'copy']);
};