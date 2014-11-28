module.exports = (grunt) ->
    require("load-grunt-tasks") grunt
    grunt.initConfig
        md2html:
            multiple_files:
                options:
                    layout: "docs/template.html"
                    basePath: "/dashboard/documents/"

                files: [
                    expand: true
                    cwd: "./docs"
                    src: ["**/*.md"]
                    dest: "./server/views/dashboard/documentation"
                    ext: ".html"
                ]

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
        "md2html"
        "coffee:build"
    ]
