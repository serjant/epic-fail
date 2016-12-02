/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function (config) {
    // Define changes to default configuration here. For example:
    // config.language = 'fr';
    // config.uiColor = '#AADC6E';

    config.toolbarGroups = [
        {name: 'document', groups: ['mode', 'document', 'doctools']},
        {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
        {name: 'styles'},
        {name: 'colors'},
        '/',
        {name: 'insert', groups: ['Table', 'getVersions']},
        {name: 'tools'},
        {name: 'others'},
        {name: 'about'},
        {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi']}
    ];

    config.extraPlugins = 'tabletools,enterkey,epicfail,caretlocator,pseudom,pastefromword,htmlwriter';
    config.enterMode = CKEDITOR.ENTER_P;
    config.forceEnterMode = true;
    config.autoGrow_onStartup = true;
    config.pasteFromWordPromptCleanup = false;
    config.pasteFromWordNumberedHeadingToList = true;
    config.pasteFromWordRemoveStyles = false;
    config.disableObjectResizing = true;
    config.pasteFromWordCleanupFile = 'plugins/pastefromword/filter/default.js';
    config.allowedContent = true;
};
