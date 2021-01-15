const reportGenerator = require('../helpers/report-generator');
const child_process = require('child_process');
const fsPromises = require('fs').promises;
const fs = require('fs');
const axios = require('axios');
const { PassThrough } = require('stream');
const testData = require('../tests/resources/report-generator.inputData');

const childProcessExecSpy = jest.spyOn(child_process, 'exec');
const fsPromiseMkDirSpy = jest.spyOn(fsPromises, 'mkdir');
const fsPromiseReadFileSpy = jest.spyOn(fsPromises, 'readFile');
const fsPromiseWriteFileSpy = jest.spyOn(fsPromises, 'writeFile');
const fsCreateWriteStreamSpy = jest.spyOn(fs, 'createWriteStream');

jest.mock('axios');

userId = 12345;

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe("Function \"report-generator\", simple functions", () => {
    test('get manual', () => {
        const template = reportGenerator.manual();
        expect(template).toContain('manual.txt');
    });

    test('get template', () => {
        const template = reportGenerator.template();
        expect(template).toContain('reportTemplate.txt');
    });

    test('garbageCollector, normal', async () => {
        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(null);
        });

        await reportGenerator.garbageCollector(userId);
        expect(childProcessExecSpy.mock.calls[0][0]).toBe(`rm -rf tmp/12345_reports`);
    });

    test('garbageCollector, error', () => {
        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(new Error('Jest test error'));
        });

        reportGenerator.garbageCollector(userId).catch((err) => {
            expect(err.message).toContain('не могу собрать мусор');
        });
    });
});


describe("Function \"report-generator\", generator", () => {
    test('normal behavior', async () => {
        fsPromiseMkDirSpy.mockImplementation((path) => {
            return new Promise((resolve => {
                resolve();
            }));
        });

        /***********function downloadFile***************/
        const mockWriteable = new PassThrough();
        const mockReadable = new PassThrough();
        const fakeReadStream = {
            data: mockReadable
        };
        axios.get.mockResolvedValue(fakeReadStream);

        fsCreateWriteStreamSpy.mockReturnValueOnce(mockWriteable);
        /***********function downloadFile**************/

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockResolvedValueOnce(testData.TEACHERS_CONTENT_XML);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            cb(null);
        });

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        const result = await reportGenerator.generate(userId, {file_path: 'test.txt'});

        expect(fsPromiseMkDirSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports`);
        expect(fsPromiseMkDirSpy.mock.calls[1][0]).toBe(`tmp/${userId}_reports/outcome`);
        expect(fsCreateWriteStreamSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/inputFile.txt`);
        expect(childProcessExecSpy.mock.calls[0][0]).toBe(`cp -r odt_templates/reportsGenerator/odtHarTemplate tmp/${userId}_reports/templateWithGeneralData`);
        expect(fsPromiseReadFileSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/inputFile.txt`);
        expect(fsPromiseReadFileSpy.mock.calls[1][0]).toBe(`tmp/${userId}_reports/templateWithGeneralData/content.xml`);
        expect(fsPromiseWriteFileSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/templateWithGeneralData/content.xml`);
        expect(fsPromiseWriteFileSpy.mock.calls[1][1]).toBe(testData.STUDENTS_CORRECT_OUTPUT);
        expect(childProcessExecSpy.mock.calls[1][0]).toBe(`cd tmp/${userId}_reports/templateWithGeneralData;zip -0 -r ../\'outcome/Богатов Михаил.odt\' *`);
        expect(childProcessExecSpy.mock.calls[2][0]).toContain('Васин Александр');
        expect(childProcessExecSpy.mock.calls[3][0]).toContain('Вишняков Олег');
        expect(childProcessExecSpy.mock.calls[4][0]).toBe(`cp -r odt_templates/reportsGenerator/odtOtchRukTemplate tmp/${userId}_reports/teacherReport`);
        expect(fsPromiseWriteFileSpy.mock.calls[3][0]).toBe(`tmp/${userId}_reports/teacherReport/content.xml`);
        expect(fsPromiseWriteFileSpy.mock.calls[3][1]).toBe(testData.TEACHERS_CORRECT_OUTPUT);
        expect(childProcessExecSpy.mock.calls[5][0]).toBe(`cd tmp/${userId}_reports/teacherReport;zip -0 -r ../'outcome/teacherReport.odt' *`);
        expect(childProcessExecSpy.mock.calls[6][0]).toBe(`cd tmp/${userId}_reports/outcome;7z a -tzip ../\'5РА-16-1уп.zip\'`);
        expect(result).toBe(`tmp/${userId}_reports/5РА-16-1уп.zip`);
    });
});
//https://dev.to/cdanielsen/testing-streams-a-primer-3n6e