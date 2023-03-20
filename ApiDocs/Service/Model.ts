import { ColumnAccessControl } from 'Common/Types/Database/AccessControl/AccessControl';
import { getTableColumns } from 'Common/Types/Database/TableColumn';
import Dictionary from 'Common/Types/Dictionary';
import Permission, {
    PermissionHelper,
    PermissionProps,
} from 'Common/Types/Permission';
import { ExpressRequest, ExpressResponse } from 'CommonServer/Utils/Express';
import ResourceUtil, { ModelDocumentation } from '../Utils/Resources';
import PageNotFoundServiceHandler from './PageNotFound';

const Resources: Array<ModelDocumentation> = ResourceUtil.getResources();
const ResourceDictionary: Dictionary<ModelDocumentation> =
    ResourceUtil.getReosurceDictionaryByPath();

const PermissionDictionary: Dictionary<PermissionProps> =
    PermissionHelper.getAllPermissionPropsAsDictionary();

export default class ServiceHandler {
    public static async executeResponse(
        req: ExpressRequest,
        res: ExpressResponse
    ): Promise<void> {
        let pageTitle: string = '';
        let pageDescription: string = '';
        let page: string | undefined = req.params['page'];
        const pageData: any = {};

        if (!page) {
            return PageNotFoundServiceHandler.executeResponse(req, res);
        }

        const currentResource: ModelDocumentation | undefined =
            ResourceDictionary[page];

        if (!currentResource) {
            return PageNotFoundServiceHandler.executeResponse(req, res);
        }

        // Resource Page.
        pageTitle = currentResource.name;
        pageDescription = currentResource.description;

        page = 'model';

        const tableColumns: any = getTableColumns(currentResource.model);

        for (const key in tableColumns) {
            const accessControl: ColumnAccessControl | null =
                currentResource.model.getColumnAccessControlFor(key);

            if (!accessControl) {
                // remove columns with no access
                delete tableColumns[key];
                continue;
            }

            if (
                accessControl?.create.length === 0 &&
                accessControl?.read.length === 0 &&
                accessControl?.update.length === 0
            ) {
                // remove columns with no access
                delete tableColumns[key];
                continue;
            }

            tableColumns[key].permissions = accessControl;
        }

        delete tableColumns['deletedAt'];
        delete tableColumns['deletedByUserId'];
        delete tableColumns['deletedByUser'];
        delete tableColumns['version'];

        pageData.title = currentResource.model.singularName;
        pageData.description = currentResource.model.tableDescription;
        pageData.columns = tableColumns;
        pageData.tablePermissions = {
            read: currentResource.model.readRecordPermissions.map(
                (permission: Permission) => {
                    return PermissionDictionary[permission];
                }
            ),
            update: currentResource.model.updateRecordPermissions.map(
                (permission: Permission) => {
                    return PermissionDictionary[permission];
                }
            ),
            delete: currentResource.model.deleteRecordPermissions.map(
                (permission: Permission) => {
                    return PermissionDictionary[permission];
                }
            ),
            create: currentResource.model.createRecordPermissions.map(
                (permission: Permission) => {
                    return PermissionDictionary[permission];
                }
            ),
        };

        return res.render('pages/index', {
            page: page,
            resources: Resources,
            pageTitle: pageTitle,
            pageDescription: pageDescription,
            pageData: pageData,
        });
    }
}
