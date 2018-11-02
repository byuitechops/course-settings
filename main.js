/*eslint-env node, es6*/

/*****************************************************
 * This child module sets course settings according
 * to predefined standards and user input for online,
 * campus, and pathway courses
 ****************************************************/

const canvas = require('canvas-wrapper');
const asyncLib = require('async');

module.exports = (course, stepCallback) => {
    /******************************************************
     * Description: The getTermID function gets the termID
     ******************************************************/
    function getTermID(termName, cb) {
        if (!termName) {
            cb(null, null);
            return;
        }
        /* use top account for enrollment terms */
        canvas.get('/api/v1/accounts/1/terms', (err, terms) => {
            if (err) {
                // An error occurred while getting the terms
                cb(err, null);
                return;
            }
            try {
                terms = terms[0].enrollment_terms;
                var term = terms.find(term => term.name === termName);
                //If there is no term that matches the name provided, attempt to get the default term id
                if (term === undefined) {
                    var defaultTerm = terms.find(term => term.name === 'Default Term');
                    if (defaultTerm === undefined) {
                        //The default term must have been erased or the name has been changed
                        throw new Error('Unable to find matching term or default term');
                    } else {
                        //Callback with the default id
                        cb(null, defaultTerm.id);
                    }
                } else {
                    //Callback with the term id
                    cb(null, term.id);
                }
            } catch (findErr) {
                //Neither the user input term nor the default term was found, so callback with error
                cb(findErr, null);
            }
        });
    }

    /******************************************************
     * Description: The buildSISID function builds the
     * SISID and returns it as a String.
     ******************************************************/
    function buildSISID() {
        var platform = course.settings.platform[0].toUpperCase() + course.settings.platform.slice(1);
        return `${platform}.Master.${course.info.courseCode}`;
    }

    /******************************************************
     * Description: The updateCourse function creates
     * objects that contatins key/value pairs of the
     * updated course object. This object is PUT to
     * Canvas which then updates the course object 
     * in Canvas.
     ******************************************************/
    function updateCourse(callback) {
        function buildPutObj(cb) {
            var onlineCourse = {
                'course[account_id]': course.settings.accountID,
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
     * Description: The updateSettings function creates an
     * object contating all of the course settings that
     * need to be updated. The function then makes a PUT
     * request to Canvas that updates all of the course
     * settings.
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
     * Description: The updateFeatures function turns on
     * the new gradebook feature in each course. As of
     * now the object only contatins one key/value pair
     * to turn on/off the new features.
     ******************************************************/
    function updateFeatures(callback) {
        var putObj = {
            'state': 'on'
        };
        canvas.put(`/api/v1/courses/${course.info.canvasOU}/features/flags/new_gradebook`, putObj, (err, newFeatures) => {
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