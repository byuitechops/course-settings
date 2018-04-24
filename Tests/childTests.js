/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');

module.exports = (course, callback) => {
    tap.test('child-template', (test) => {
        //Check if the course updated
        canvas.get(`/api/v1/courses/${course.info.canvasOU}`, (err, canvasCourse) => {
            if (err) {
                console.error(err.stack);
                tap.fail('Failed to get the course object');
            } else {
                canvasCourse = canvasCourse[0];
                var testObj = {
                    //'license': 'private', -- Do not have permissions
                    'is_public_to_auth_users': false,
                    'is_public': false,
                    'public_syllabus_to_auth': true,
                    'course_format': 'online',
                    'enrollment_term_id': 5,
                    'locale': 'en',
                    'time_zone': 'America/Denver',
                    'grading_standard_id': 1,
                    //'sis_course_id': buildSISID() -- Do not have permissions
                };
                for (const x in testObj) {
                    tap.equal(canvasCourse[x], testObj[x], `${x} failed to update.`);
                }
            }

        });

        //Check if the course settings were updated
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/settings`, (err, courseSettings) => {
            if (err) {
                console.error(err.stack);
                tap.fail('Failed to get the course settings object');
            } else {
                courseSettings = courseSettings[0];
                var putObj = {
                    'lock_all_announcements': false,
                    'allow_student_forum_attachments': true,
                    'show_announcements_on_home_page': true,
                    'allow_student_organized_groups': false,
                    'home_page_announcement_limit': 2,
                };
                for (const x in putObj) {
                    tap.equal(courseSettings[x], putObj[x], `${x} failed to update.`);
                }
            }
        });

        //Check if the new gradebook was enabled
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/features/flags/new_gradebook`, (err, newGradebook) => {
            if (err) {
                console.error(err.stack);
                tap.fail('Failed to get the new Gradebook object');
            } else {
                newGradebook = newGradebook[0];
                var testObj = {
                    'state': 'on'
                };
                for (const x in testObj) {
                    tap.equal(newGradebook[x], testObj[x], 'The new gradebook failed to enable.');
                }
            }
        });

        test.end();
    });

    callback(null, course);
};
