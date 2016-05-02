var _ = require('lodash'),
    Spreadsheet = require('edit-google-spreadsheet');

module.exports = {
    checkAuthOptions: function (step, dexter) {

        if(!step.input('rowContents').first())
            return 'A [worksheet, rowContents] inputs variable is required for this module';

        if(!dexter.environment('google_spreadsheet'))
            return 'A [google_spreadsheet] environment variable is required for this module';

        return false;
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var credentials = dexter.provider('google').credentials(),
            error = this.checkAuthOptions(step, dexter);

        var spreadsheetId = dexter.environment('google_spreadsheet'),
            worksheetId = step.input('worksheet', 1).first(),
            rowContents;

        if (error)
            return this.fail(error);

        if (_.isObject(step.input('rowContents').first()) || _.isArray(step.input('rowContents').first()))
            rowContents = step.input('rowContents').first();
        else
            rowContents = step.input('rowContents').toArray();

        Spreadsheet.load({
            spreadsheetId: spreadsheetId,
            worksheetId: worksheetId,
            accessToken: {
                type: 'Bearer',
                token: _.get(credentials, 'access_token')
            }
        }, function (err, spreadsheet) {
            if (err)
                return this.fail(err);

            spreadsheet.receive(function (err, rows, info) {
                var newLastRowNumber = info.lastRow + 1;
                var rowToAdd = {};
                rowToAdd[parseInt(newLastRowNumber)] = rowContents;

                spreadsheet.add(rowToAdd);
                spreadsheet.send(function (err) {
                    err? this.fail(err) : this.complete({success: true});
                }.bind(this));

            }.bind(this));

        }.bind(this))
    }
};
