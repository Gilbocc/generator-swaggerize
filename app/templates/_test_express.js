'use strict';

var test = require('tape'),
    path = require('path'),
    express = require('express'),
    enjoi = require('enjoi'),
    swaggerize = require('swaggerize-express'),
    request = require('supertest');

test('api', function (t) {
    var app = express();

    <%_.forEach(operations, function (operation) { if (operation.method.toLowerCase() === 'post' || operation.method.toLowerCase() === 'put') { %>
    app.use(require('body-parser')());<%}});%>

    app.use(swaggerize({
        api: require('<%=apiPath%>'),
        handlers: path.join(__dirname, '<%=handlers%>')
    }));

    <%_.forEach(operations, function (operation) {%>
    t.test('test <%=operation.method%> <%=operation.path%>', function (t) {
        <%
        var path = operation.path;
        var body;
        var responseCode = operation.responses && Object.keys(operation.responses)[0];
        var response = responseCode && operation.responses[responseCode];
        var responseSchema = response && response.schema;
        if (operation.parameters && operation.parameters.length) {
            _.forEach(operation.parameters, function (param) {
                if (param.in === 'path') {
                    path = operation.path.replace(/{([^}]*)}*/, function (p1, p2) {
                        switch (param.type) {
                            case 'integer':
                            case 'number':
                            case 'byte':
                                return 1;
                            case 'string':
                                return 'helloworld';
                            case 'boolean':
                                return true;
                            default:
                                return '{' + p2 + '}';
                        }
                    });
                }
                if (param.in === 'body') {
                    body = models[param.schema.$ref.slice(param.schema.$ref.lastIndexOf('/') + 1)];
                }
            });
        }
        if (operation.method.toLowerCase() === 'post' || operation.method.toLowerCase() === 'put') {%>
        var body = {<%_.forEach(Object.keys(body).filter(function (k) { return !!body[k]; }), function (k, i) {%>
            '<%=k%>': <%=JSON.stringify(body[k])%><%if (i < Object.keys(body).filter(function (k) { return !!body[k]; }).length - 1) {%>, <%}%><%})%>
        };
        <%} if (responseSchema) {%>
        var responseSchema = Enjoi({<%_.forEach(Object.keys(responseSchema), function (k, i) {%>
            '<%=k%>': <%=JSON.stringify(responseSchema[k])%><%if (i < Object.keys(responseSchema).length - 1) {%>, <%}%><%})%>
        }, {
            '#': require('<%=apiPath%>')
        });
        <%}%>

        request(app).<%=operation.method.toLowerCase()%>('<%=resourcePath%><%=path%>')
        .expect(200)<%if (operation.method.toLowerCase() === 'post' || operation.method.toLowerCase() === 'put'){%>.send(body)<%}%>
        .end(function (err, res) {
            t.ok(!err, '<%=operation.method.toLowerCase()%> <%=operation.path%> no error.');
            t.strictEqual(res.statusCode, <%=responseCode%>, '<%=operation.method.toLowerCase()%> <%=operation.path%> <%=responseCode%> status.');<%if (responseSchema) {%>
            responseSchema.validate(res.body, function (error) {
                t.ok(!error, 'Response schema valid.');
            });<%}%>
            t.end();
        });
    });
    <%});%>

});
