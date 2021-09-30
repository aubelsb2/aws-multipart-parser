import { MultipartFormData } from './models';

function getValueIgnoringKeyCase(object: Object, key: string) {
    const foundKey = Object
        .keys(object)
        .find(currentKey => currentKey.toLocaleLowerCase() === key.toLowerCase());
    return object[foundKey];
}

function getBoundary(event: GenericProxyEvent): string {
    return getValueIgnoringKeyCase(event.headers, 'Content-Type').split('=')[1];
}

function getBody(event: GenericProxyEvent): string {
    if (event.isBase64Encoded) {
        return Buffer.from(event.body || "", 'base64').toString('binary');
    }
    return event.body || "";
}

// Should reduce to either: APIGatewayProxyEvent or APIGatewayProxyEventV2
export interface GenericProxyEvent {
    body?: string | null;
    isBase64Encoded: boolean;
    headers: APIGatewayProxyEventHeaders;
}

export let parse = (event: GenericProxyEvent, spotText: boolean): MultipartFormData =>  {
    const boundary = getBoundary(event);
    const result : MultipartFormData = {};
    getBody(event)
        .split(boundary)
        .forEach(item => {
            if (/filename=".+"/g.test(item)) {
                result[item.match(/name=".+";/g)[0].slice(6, -2)] = {
                    type: 'file',
                    filename: item.match(/filename=".+"/g)[0].slice(10, -1),
                    contentType: item.match(/Content-Type:\s.+/g)[0].slice(14),
                    content: spotText? Buffer.from(item.slice(item.search(/Content-Type:\s.+/g) + item.match(/Content-Type:\s.+/g)[0].length + 4, -4), 'binary'):
                        item.slice(item.search(/Content-Type:\s.+/g) + item.match(/Content-Type:\s.+/g)[0].length + 4, -4),
                };
            } else if (/name=".+"/g.test(item)){
                result[item.match(/name=".+"/g)[0].slice(6, -1)] = item.slice(item.search(/name=".+"/g) + item.match(/name=".+"/g)[0].length + 4, -4);
            }
        });
    return result;
};
