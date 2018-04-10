/*eslint-env node, es6*/

/* Module Description */

const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {
    function updateCourse(callback) {
        var testObj = {
            'course[license]': 'private',
            'course[is_public_to_auth_users]': false,
            'course[is_public]': false,
            'course[public_syllabus_to_auth]': true,
            'course[course_format]': 'online',
            'course[term_id]': 5,
            'course[locale]': 'en',
            'course[time_zone]': 'America/Denver',
            'course[grading_standard_id]': 1
        };
        canvas.put(`/api/v1/courses/${course.info.canvasOU}`, testObj, (err, newCourse) => {
            if (err) {
                course.error(err);
                callback(null);
                return;
            }
            course.message('Course updated successfully.');
            // console.log(newCourse);
            callback(null);
        });
    }

    function updateSettings(callback) {
        var testObj = {
            'lock_all_announcements': false,
            'allow_student_forum_attachments': true,
            'show_announcements_on_home_page': true,
            'allow_student_organized_groups': false,
            'home_page_announcement_limit': 2,


        };
        canvas.put(`/api/v1/courses/${course.info.canvasOU}/settings`, testObj, (err, newSettings) => {
            if (err) {
                course.error(err);
                callback(null);
                return;
            }
            course.message('Course settings updated successfully.');
            // console.log(newSettings);
            callback(null);
        });
    }

    function updateFeatures(callback) {
        var testObj = {
            'state': 'on'
        };
        canvas.put(`/api/v1/courses/${course.info.canvasOU}/features/flags/new_gradebook`, testObj, (err, newFeatures) => {
            if (err) {
                course.error(err);
                callback(null);
                return;
            }
            course.message('Course features updated successfully.');
            // console.log(newFeatures);
            callback(null);
        });
    }

    var tasks = [
        updateCourse,
        updateSettings,
        updateFeatures
    ];

    asyncLib.series(tasks, (err) => {
        if (err) {
            course.error(err);
        }
        stepCallback(null, course);
    });

};
