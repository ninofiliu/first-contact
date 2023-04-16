const pre = document.createElement("pre");
document.body.append(pre);

const fullDict: { [key: string]: any } = {};

export default (dict: { [key: string]: any }) => {
  Object.assign(fullDict, dict);
  pre.innerHTML = Object.entries(fullDict)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};
