module.exports = (grunt) ->
    require("load-grunt-tasks") grunt
    grunt.initConfig
        coffee:
            build:
                options:
                    header: true
                expand: true
                cwd: "src/"
                src: ["**/*.coffee"]
                dest: "./"
                ext: ".js"

    grunt.registerTask "default", [
        "coffee:build"
    ]
