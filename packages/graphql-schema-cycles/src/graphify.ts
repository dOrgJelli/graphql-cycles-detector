export function convertToGraph(data: any, excludeList: string[]) {
  var Graph: any = [];
  var vertices = 0;
  var edges = 0;

  var total_vertices = 0;

  const graphQLTypes = ["Int", "String", "ID", "Boolean", "Float"];

  function addToGraph(target: any) {
    for (var objectName in data[target]) {
      var derived_by = [];
      var is_derived = false;
      vertices++;

      if (!excludeList.includes(objectName)) {
        var objectType = data[target][objectName];

        if (objectType["implements"] !== undefined) {
          is_derived = true;

          derived_by.push(Object.keys(objectType["implements"])[0]);
          objectType =
            objectType["implements"][Object.keys(objectType["implements"])[0]];

          while (objectType["&"] !== undefined) {
            derived_by.push(Object.keys(objectType["&"])[0]);
            objectType = objectType["&"][Object.keys(objectType["&"])[0]];
          }
        }

        var tmpReferenceList = [];
        for (var fields in objectType) {
          if (
            objectType[fields]["type"] === undefined &&
            objectType[fields]["args"] !== undefined
          ) {
            objectType[fields]["type"] = objectType[fields]["args"]["type"];
          }

          if (!graphQLTypes.includes(objectType[fields].type)) {
            // if not a standard type
            if (target === "union") {
              tmpReferenceList.push({ label: "#union_ref", reference: fields });
            } else {
              tmpReferenceList.push({
                label: fields,
                reference: objectType[fields].type,
              });
            }
          }
        }
        var tmpVertex: any = { vertexID: objectName };
        tmpVertex.vertexType = target;
        tmpVertex.referenceList = tmpReferenceList;
        Graph[objectName] = tmpVertex;

        if (is_derived) {
          for (var der in derived_by) {
            Graph[derived_by[der]].referenceList.push({
              label: "#interface_ref",
              reference: objectName,
            });
          }
        }
      }
    }
  }

  function connectVertices() {
    for (var vertex in Graph) {
      for (var ref in Graph[vertex].referenceList) {
        var reference = Graph[vertex].referenceList[ref].reference;
        edges++;
        if (Graph[reference] === undefined) {
          throw new Error("Field - reference not defined");
        }
        Graph[vertex].referenceList[ref].reference = Graph[reference];
      }
    }
  }

  for (var _enum in data["enum"]) {
    graphQLTypes.push(_enum);
  }

  for (var _scalar in data["scalar"]) {
    graphQLTypes.push(_scalar);
  }
  var returndata: any = {};

  addToGraph("interface");
  returndata.nrInterface = vertices;
  total_vertices = vertices;

  addToGraph("union");
  returndata.nrUnion = vertices - total_vertices;
  total_vertices += vertices;

  addToGraph("type");
  returndata.nrType = vertices - total_vertices;
  total_vertices += vertices;

  connectVertices();

  returndata.graph = Graph;
  returndata.edges = edges;
  returndata.vertices = vertices;

  return returndata;
}
