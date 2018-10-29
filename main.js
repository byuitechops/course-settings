/*eslint-env node, es6*/

/*****************************************************
 * This child module sets course settings according
 * to predefined standards and user input for online,
 * campus, and pathway courses
 ****************************************************/

const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {
    function getTermID(termName, cb) {
        if (!termName) {
            cb(null, null);
            return;
        }
        /* use top account for enrollment terms */
        canvas.get('/api/v1/accounts/1/terms', (err, terms) => {
            if (err) {
                cb(err, null);
                return;
            }

            try {
                terms = terms[0].enrollment_terms;

                var term = terms.find(term => term.name === termName);
                if (term == undefined) {
                    throw new Error('Unable to find matching term');
                } else {
                    cb(null, term.id);
                }

            } catch (findErr) {
                cb(findErr, null);
            }
        });
    }

    /******************************************************
     *                  buildSISID()
     *
     * Arguments: None
     * 
     * Description: The buildSISID function builds the
     * SISID and returns it as a String.
     * 
     * Return Type: String
     ******************************************************/
    function buildSISID() {
        var platform = course.settings.platform[0].toUpperCase() + course.settings.platform.slice(1);
        return `${platform}.Master.${course.info.courseCode}`;
    }

    /******************************************************
     *                  updateCourse()
     *
     * Arguments: callback
     * 
     * Description: The updateCourse function creates a
     * test object that contatins key/value pairs of the
     * updated course object. This object is PUT to
     * Canvas which then updates the course object 
     * in Canvas.
     * 
     * Return Type: none
     ******************************************************/
    function updateCourse(callback) {
        function buildPutObj(cb) {
            var onlineCourse = {
                'course[license]': 'private',
                'course[is_public_to_auth_users]': false,
                'course[is_public]': false,
                'course[public_syllabus_to_auth]': true,
                'course[course_format]': 'online',
                'course[term_id]': 5,
                'course[locale]': 'en',
                'course[time_zone]': 'America/Denver',
                'course[grading_standard_id]': 1,
                'course[sis_course_id]': buildSISID()
            };
            var campusCourse = {
                'course[license]': 'private',
                'course[is_public_to_auth_users]': false,
                'course[is_public]': false,
                'course[public_syllabus_to_auth]': true,
                'course[course_format]': 'on_campus',
                'course[term_id]': 5,
                'course[locale]': 'en',
                'course[time_zone]': 'America/Denver',
                'course[grading_standard_id]': 1,
                'course[sis_course_id]': `${buildSISID()}-InstructorLastName`
            };

            if (course.settings.platform !== 'campus') {
                cb(onlineCourse);
            } else {
                getTermID(course.settings.term, (err, termId) => {
                    if (err) {
                        course.error(err);
                    } else if (termId === null) {
                        course.warning('Unable to determine termID');
                    } else {
                        campusCourse['course[term_id]'] = termId;
                    }

                    cb(campusCourse);
                });
            }
        }

        buildPutObj((putObj) => {
            canvas.put(`/api/v1/courses/${course.info.canvasOU}`, putObj, (err, newCourse) => {
                if (err) {
                    course.error(err);
                    callback(null);
                    return;
                }
                course.message('Course updated successfully.');
                callback(null);
            });
        });
    }

    /******************************************************
     *                  updateSettings()
     *
     * Arguments: callback
     * 
     * Description: The updateSettings function creates an
     * object contating all of the course settings that
     * need to be updated. The function then makes a PUT
     * request to Canvas that updates all of the course
     * settings.
     * 
     * Return Type: none
     ******************************************************/
    function updateSettings(callback) {

        var campusObj = {
            'lock_all_announcements': false,
            'allow_student_forum_attachments': true,
            'show_announcements_on_home_page': true,
            'allow_student_organized_groups': false,
            'home_page_announcement_limit': 2,
        };

        var onlineObj = {
            'lock_all_announcements': false,
            'allow_student_forum_attachments': true,
            'show_announcements_on_home_page': true,
            'allow_student_discussion_editing': true,
            'allow_student_organized_groups': true,
            'home_page_announcement_limit': 2,
        };

        var putObj = course.settings.platform === 'online' ? campusObj : onlineObj;

        canvas.put(`/api/v1/courses/${course.info.canvasOU}/settings`, putObj, (err, newSettings) => {
            if (err) {
                // An error occurred while updating the course settings
                course.error(err);
                callback(null);
                return;
            }
            course.message('Course settings updated successfully.');
            callback(null);
        });
    }

    /******************************************************
     *                  updateFeatures()
     *
     * Arguments: callback
     * 
     * Description: The updateFeatures function turns on
     * the new gradebook feature in each course. As of
     * now the object only contatins one key/value pair
     * to turn on/off the new features.
     * 
     * Return Type: none
     ******************************************************/
    function updateFeatures(callback) {
        var testObj = {
            'state': 'on'
        };
        canvas.put(`/api/v1/courses/${course.info.canvasOU}/features/flags/new_gradebook`, testObj, (err, newFeatures) => {
            if (err) {
                // An error occurred while turning on the new gradebook
                course.error(err);
                callback(null);
                return;
            }
            course.message('Course features updated successfully.');
            callback(null);
        });
    }

    /**************
     * START HERE
     *************/
    var tasks = [
        updateCourse,
        updateSettings,
        updateFeatures
    ];

    // Call each function in the tasks list. When finished continue onto the next tool
    asyncLib.series(tasks, (err) => {
        if (err) {
            course.error(err);
        }
        stepCallback(null, course);
    });

};