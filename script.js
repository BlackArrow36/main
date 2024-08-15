class Item {
    constructor(name,parent) {
        this.name = name;
        this.parent = parent;
    }

    toJSON() {
        return {
            type: 'Item',
            name: this.name
        };
    }

    static fromJSON(json) {
        return new Item(json.name,json.parent);
    }
}

class Folder {
    constructor(fname,id,parent,order) {
        this.fname = fname;
        this.id = id;
        this.parent = parent;
        this.items = [];
        this.folders = [];
        this.order = order;
    }
    moveFolder(currentIndex, newIndex) {
        if(!item instanceof Item){
            return;
        }
        if (newIndex >= 0 && newIndex < this.folders.length) {
            const [movedFolder] = this.folders.splice(currentIndex, 1);
            this.folders.splice(newIndex, 0, movedFolder);
            this.updateFolderOrders();
        }
    }

    updateFolderOrders() {
        this.folders.forEach((folder, index) => {
            folder.order = index;
        });
    }
    addItem(item) {
        let names = [];
        item.parent = this;
        if (item instanceof Item) {
            names = this.getAllItemNames();
            if(names.includes(item.name)){
                return false;
            }
            this.items.push(item);
        } else if (item instanceof Folder) {
            names = this.getAllFolderNames();
            console.log(names)
            if(names.includes(item.fname)){
                return false;
            }

            this.folders.push(item);
        }
        return true
    }



    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    toJSON() {
        let json = {
            type: 'Folder',
            fname:this.fname,
            id: this.id,
            items: this.items.map(item => item.toJSON()),
            folders: this.folders.map(folder => folder.toJSON())
        }
        return json;
    }

    static fromJSON(json) {
        if(json == null){
            return (console.error("JSON WAS NULL!"))
        }
        if(json.items){
            let folder = new Folder(json.fname,json.id,null,json.order)
            for (let item of json.items) {
                folder.addItem(Item.fromJSON(item));
            }
            for (let folders of json.folders) {
                folder.addItem(Folder.fromJSON(folders));
            }
            return folder;
        }
        
    }

    getItem(name){
        let Folders = this.getAllFolders();
        Folders.forEach(folder => {
            if (folder instanceof Folder) {
                let Items = folder.getItems()
                Items.forEach(item => {
                    if(item.name == name){
                        return item;
                    }
                })
            }
        });
    }
    moveItem(item, targetFolder) {
        if(!item instanceof Item){
            return;
        }
        this.removeItem(item);
        targetFolder.addItem(item);
        targetFolder.sortItems();
        save_frequent();
    }
    removeFolder(folder) {
        const index = this.folders.indexOf(folder);
        if (index > -1 && folder instanceof Folder) {
            this.folders.splice(index, 1);
        }
        this.updateFolderOrders();
        save_frequent();
    }

    removeFolderByName(fname) {
        const folder = this.items.find(item => item instanceof Folder && item.fname === fname);
        if (folder) {
            this.removeFolder(folder);
        }
        
        this.updateFolderOrders();
        save_frequent();
    }

    sortItems() {
        this.items.sort((a, b) => {
                return a.name.localeCompare(b.name);
        });
        this.folders.sort((a, b) => {
            return a.fname.localeCompare(b.fname);
        });
    }
    parseFolder(folderCallback, itemCallback) {
        for (let item of this.items) {
            if (item instanceof Folder) {
                folderCallback(item); // Custom action for folders
                item.parseFolder(folderCallback, itemCallback); // Recursive call for nested folders
            } else if (item instanceof Item) {
                itemCallback(item); // Custom action for items
            }
        }
    }
    createElement(loc,fileprefix,folderprefix,folders) {
        //console.log("creating frequent")
        const folderID = folderprefix + this.fname
        const folder = createDiv("folder",null,folderID,loc)
        folder.setAttribute('data-id', folderID);
        const folderinfo = createDiv("folderinfo",null,null,folder)
        let foldername;
        if(this.parent && this.fname != "General"){
            foldername = createBasicElement("input","folder_name_text",null,null,folderinfo)
            foldername.classList.add("circular")
            foldername.value = this.fname
            foldername.addEventListener('change', 
                ()=>{
                if(!this.getAllFolderNames().includes(this.fname)){
                    foldername.value = this.fname
                    alert("Foldername not unique")
                }else{
                    this.fname = foldername.value;
                    folder.id = folderprefix+this.fname
                    save_frequent();}
                });
            const buttonremove = createButton("remove",{margin: "5px",width:"30px",color:"red"},null,folderinfo,()=>{
                if(confirm("Czy chcesz usunac folder "+this.fname)){
                    this.parent.removeFolder(this)}
                }
                ,"X")
        }else if(this.parent && this.fname == "General"){
            foldername = createDiv("folder_name_text",null,null,folderinfo)
            foldername.innerText = this.fname;
            const buttonclear = createButton("remove",{margin: "5px",width:"30px",color:"red"},null,folderinfo,()=>{
                if(confirm("Czy chcesz wyczyscic General?")){
                    this.folders = []
                    this.items = []
                    save_frequent()
                    folder.replaceChildren(folderinfo)
                }
            },"x")
        }   
        else{
            foldername = createDiv("folder_name_text",null,null,folderinfo)
            foldername.classList.add("circular")
            foldername.innerText = this.fname;
            if(folders){
            const buttonadd = createButton("remove",{margin: "5px",width:"30px"},null,folderinfo,()=>{
                let folder_root = folder.root
                if(!folder.root){
                    folder_root = folder
                }
                let name = "newfolder"
                let newfolder = new Folder(name,fileprefix+name,folder)
                if(this.addItem(newfolder)){
                    newfolder.createElement(folder,fileprefix,folderprefix,folders);
                    save_frequent();
                }
            },"+")
        }
        }
        attachDropEvents(folder,this)
        foldername.textContent = this.fname;
        //console.log(this.items)
        this.items.forEach(item => {
            const d_item = createDiv("file",null,null,folder)
            let itemID = "file_"+item.name
            d_item.setAttribute('draggable', 'true');
            d_item.setAttribute('data-id', itemID);
            const p_item = createBasicElement("p","item",null,itemID,d_item)
            p_item.textContent = item.name;
            if(folders){
                const buttonremove = createButton("remove",{margin: "5px",width:"30px",color:"red"},null,d_item,()=>{
                    if(confirm("czy napewno chcesz usunac "+item.name)){
                        this.removeItem(item)
                        d_item.remove();
                        save_frequent();
                    }
                },"x")
                const buttonadd = createButton("remove",{margin: "5px",width:"30px",color:"green"},null,d_item,()=>{
                    let value = item.name
                    if (input_array.includes(value)) {
                        alert('I require unique values');
                        return;
                    }
                    input_array.push(value);
                    const parentElement = document.getElementById('elements');
                    const prefix = "element"
                    const divID = prefix + value;
                    const div = createDiv("element", null, divID, parentElement);
                    const text = createBasicElement("input",null,{width:"110px"},divID+"input",div)
                    div.setAttribute('data-value', value)
                    text.value = value;
                    text.addEventListener('change', () => {
                        updateArrayValue(input_array,div.getAttribute('data-value'),text.value)
                        if(frequent_list.getFolder("General").addItem(new Item(text.value))){
                            sorted = false;
                        }
                    });
                    const button = createButton("remove", {marginLeft:"10px"}, divID+"button",div, ()=>remove(div,prefix), "X");
                },"+")
            }
            
            attachDragEvents(d_item,item);
        });
        this.folders.forEach(item => {
            item.createElement(folder,fileprefix,folderprefix,folders); // Recursively create HTML for nested folders
        });
        return folder;
    }
    getRoot(){
        let root = this
        while(root.parent){
            root = root.parent
        }
        return root;
    }
    getAllItems() {
        let Items = this.getItems();
        let Folders = this.getAllFolders();
        Folders.forEach(folder => {
            if (folder instanceof Folder) {
                Items = Items.concat(folder.getItems()); // Recursively get items from nested folders
            }
        });
        return Items;
    }
    getItems(){
        let Items = [];
        this.items.forEach(item => {
            if (item instanceof Item) {
                Items.push(item); // Recursively get items from nested folders
            }
        });
        return Items;
    }
    getAllItemNames(){
        let items = this.getAllItems();
        let itemnames = []
        items.forEach(item => {
            itemnames.push(item.name)
        });
        return itemnames;
    }
    getAllFolders() {
        let root = this.getRoot()
        let Folders = [];
        root.folders.forEach(item => {
            Folders = Folders.concat(item.getFolders()); // Recursively get items from nested folders
        });
        return Folders;
    }
    getFolders(){
        let Folders = [this];
        this.folders.forEach(item => {
            if (item instanceof Folder) {
                Folders = Folders.concat(item.getFolders()); // Recursively get items from nested folders
            }
        });
        return Folders;
    }
    getAllFolderNames(){
        let folders = this.getAllFolders();
        console.log(folders)
        let foldernames = []
        folders.forEach(item => {
            foldernames.push(item.fname)
        });
        return foldernames;
    }
    getFolder(foldername) {
        let Folders = this.getAllFolders();
        let answer = Folders.find(folder => {
            return folder.fname == foldername;
        });
        return answer;
    }
    
}


function togglePanel() {
    const panel = document.getElementById('sidePanel');
    const teams = document.getElementById('teams');
    const button = document.getElementById('toggleButton');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        teams.style.marginRight = "340px"
        button.innerHTML = '&#9654;'; // Right arrow
        button.style.right = '300px'; // Move the button to align with the panel
    } else {
        teams.style.marginRight = "40px"
        button.innerHTML = '&#9664;'; // Left arrow
        button.style.right = '0'; // Move the button to its original position
    }
}

var input_array = []
var frequent_list = null
var frequent_list_items = []
var lista=[]
let count=2
let sorted = true;

function update_count(value){
    count = value;
}

function createBasicElement(type,classname,style,id,parent){
    newItem = document.createElement(type);
    if (classname) {
        newItem.className = classname;
    }
    if (style) {
        for (const property in style) {
            newItem.style[property] = style[property];
        }
    }
    if (id) {
        newItem.id = id;
    }
    if (parent) {
        if (parent.appendChild) {
            parent.appendChild(newItem);
        }
    }
    return newItem;
}
function createDiv(classname, style, id, parent) {
    return(createBasicElement("div",classname,style,id,parent))
}
function createButton(classname, style, id,parent, fun,txt) {
    newButton = createBasicElement("button",classname,style,id,parent)
    if (fun) {
        newButton.addEventListener('click', fun);
    }
    if(txt){
        newButton.innerText=txt;
    }
    return newButton;
}

function createText(classname,style,id,parent,txt){
    newText = createBasicElement("span",classname,style,id,parent)
    if(txt){
        newText.innerText=txt;
    }
    return newText;
}

function remove(element,prefix) {
    value = element.id.substring(prefix.length);
    element.remove();
    input_array = input_array.filter(item => item !== value);
    
}
function updateArrayValue(array, oldValue, newValue) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] == oldValue) {
            array[i] = newValue;
            return array;
        }
    }
    return array;
    
}

function add(input) {
    value = input.value;
    if (input_array.includes(value)) {
        alert('I require unique values');
        return;
    }
    input_array.push(value);
    const parentElement = document.getElementById('elements');
    const prefix = "element"
    const divID = prefix + value;
    const div = createDiv("element", null, divID, parentElement);
    const text = createBasicElement("input",null,{width:"130px",margin:"0 auto"},divID+"input",div)
    div.setAttribute('data-value', value)
    text.value = value;
    text.addEventListener('change', () => {
        console.log(input_array)
        console.log(div.getAttribute('data-value'))
        console.log(text.value)
        if (input_array.includes(text.value)) {
            alert('I require unique values');
            text.value = div.getAttribute('data-value')
            return;
        }
        updateArrayValue(input_array,div.getAttribute('data-value'),text.value)
        div.setAttribute('data-value', text.value)
        if(frequent_list.getFolder("General").addItem(new Item(text.value))){
            sorted = false;
        }
    });
    const button = createButton("remove", {marginLeft:"10px"}, divID+"button",div, ()=>remove(div,prefix), "X");
    input.value = ""
    if(frequent_list.getFolder("General").addItem(new Item(value))){
        sorted = false;
    }
}
function shuffle(array,times) {
    for(let i = 0; i < times ; i++){
        let currentIndex = array.length;
        while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
    }
}
//poprawka do zrobienia -> podzial na nierowne grupy
function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    for (let subArray of result) {
        subArray.sort();
    }
    return result;
}
function createTeams(array) {
    const oddTeams = array.length % count
    const teamsize = (array.length - oddTeams)/count
    const result = [];
    for (let i = 0; i < array.length; i += teamsize) {
        if(i < oddTeams){
            result.push(array.slice(i, i + 1 + teamsize));
            i = i+1
        }else{
            result.push(array.slice(i, i + teamsize));
        }
    }
    for (let subArray of result) {
        subArray.sort();
    }
    return result;
}
function roll(){
    if(count < 2){
        return(alert("You need at least two teams"))
    }else if(input_array.length % count != 0){
        if(confirm("Teams will not be equal") != true){
            return;
        }
    }else if(input_array.length == 0){
        return(alert("Empty list"));
    }
    if(!sorted){
        frequent_list.sortItems();
        save_frequent();
        make_frequent();
    }
    shuffle(input_array,7)
    const chunkSize = Math.ceil(input_array.length / count);
    generate(createTeams(input_array, chunkSize))
}

function generate(arrays){
    let location = document.getElementById('teams');
    location.innerHTML="";
    let div = createDiv("element",{marginTop:"10px",marginBottom:"10px"},"teams_message",location)
    div.classList.add("circular")
    div.innerText="Wylosowane druzyny"
    let teamfolder = createDiv("team_folder",null,"team_folder",location)
    for (let i = 0; i < arrays.length; i++) {
        let teamlocation = createDiv("team",null,null,teamfolder)
        let teamname = "Team "+i
        let teamnameid = teamname+" id"
        let team = new Folder(teamname,teamnameid,null,i)
        for (let j = 0; j < arrays[i].length; j++) {
            let personname = arrays[i][j]
            let person = new Item(personname,null)
            team.addItem(person)
        }
        team.createElement(teamlocation,"file_"+i+"_","folder_"+i+"_",false)
    }
    
}

function make_frequent(){
    //console.log(frequent_list)
    if(frequent_list == null){
        get_frequent();
    }
    let location = document.getElementById("frequent")
    location.innerHTML=""
    frequent_list.createElement(location,"fileprefix_","folderprefix_",true)
}

function save_frequent(){
    frequent_list.sortItems();
    let json = JSON.stringify(frequent_list.toJSON())
    localStorage.setItem("frequent",json)
    make_frequent();
}

function get_frequent(){
    let frequent = null;
    if(localStorage.getItem("frequent")){
        frequent = Folder.fromJSON(JSON.parse(localStorage.getItem("frequent")))
    }
    if(frequent == null){
        frequent = new Folder("Root Folder",null,null,0)
        frequent.addItem(new Folder("General",null,null,0))
    }
    frequent_list = frequent;
    return frequent
}

let draggedElement = null;
let draggedFile = null;
function handleDragStart(event,file,element) {
    if (element.classList.contains('file')) {
        draggedElement = element;
        draggedFile = file;
        element.classList.add('dragging');
    } else {
        event.preventDefault();
    }
}
function handleDragEnd(event) {
    event.target.classList.remove('dragging');
}
function handleDragOver(event) {
    if (event.target.closest('.folder')) {
        event.preventDefault();
    }
}
function handleDrop(event,folder,destination) {
    event.preventDefault();
    if (destination && draggedElement){
        draggedFile.parent.moveItem(draggedFile,folder)
        destination.appendChild(draggedElement);
        draggedElement = null;
        draggedFile = null;
    }
}

function removePrefix(str, prefix) {
    if (str.startsWith(prefix)) {
        return str.substring(prefix.length);
    }
    return null;
}

function attachDragEvents(element,file) {
    element.addEventListener('dragstart', (event) => handleDragStart(event, file,element));
    element.addEventListener('dragend', handleDragEnd);
}

function attachDropEvents(destination,folder) {
    destination.addEventListener('dragover', handleDragOver);
    destination.addEventListener('drop', (event) => handleDrop(event, folder,destination));
}
