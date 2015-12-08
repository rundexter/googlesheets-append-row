var _ = require('lodash'),
    Spreadsheet = require('edit-google-spreadsheet');

module.exports = {
    checkAuthOptions: function (step, dexter) {

        if(!step.input('rowContents').first()) {

            this.fail('A [worksheet, rowContents] inputs variable is required for this module');
        }

        if(!dexter.environment('google_access_token') || !dexter.environment('google_spreadsheet')) {

            this.fail('A [google_access_token, google_spreadsheet] environment variable is required for this module');
        }
    },

    convertColumnLetter: function(val) {
        var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            result = 0;

        var i, j;

        for (i = 0, j = val.length - 1; i < val.length; i += 1, j -= 1) {

            result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
        }

        return result;
    },

    pickSheetData: function (rows, startRow, startColumn, numRows, numColumns) {
        var sheetData = {};

        for (var rowKey = startRow; rowKey <= numRows; rowKey++) {

            for (var columnKey = startColumn; columnKey <= numColumns; columnKey++) {

                if (rows[rowKey] !== undefined && rows[rowKey][columnKey] !== undefined) {

                    sheetData[rowKey] = sheetData[rowKey] || {};
                    sheetData[rowKey][columnKey] = rows[rowKey][columnKey];
                }
            }
        }

        return sheetData;
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {

        var spreadsheetId = dexter.environment('google_spreadsheet');


        var worksheetId = step.input('worksheet', 1).first(),
            rowContents = step.input('rowContents').first();

        this.checkAuthOptions(step, dexter);

        Spreadsheet.load({
            spreadsheetId: spreadsheetId,
            worksheetId: worksheetId,
            accessToken: {
                type: 'Bearer',
                token: dexter.environment('google_access_token')
            }
        }, function (err, spreadsheet) {

            if (err) {

                this.fail(err);
            } else {

                spreadsheet.add(rowContents);

                spreadsheet.send(function (err) {

                    if (err) {

                        this.fail(err);
                    } else {

                        this.complete({success: true});
                    }
                }.bind(this));
            }

        }.bind(this))
    }
};
