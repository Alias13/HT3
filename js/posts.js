var sortedData = [];
var searchData = [];

class Post {
    constructor(obj) {
        this.id = Post.incrementId();
        this.title = obj.title;
        this.image = obj.image;
        this.description = obj.description;
        this.createdAt = obj.createdAt;
        this.tags = obj.tags;
    }

    static incrementId() {
        if (!this.latestId){
            this.latestId = 1;
        }else{
            this.latestId++;
        }
        return this.latestId;
    }

    getTemplate() {
        let template = document.querySelector('#template');
        if (!template) {
            console.error("Could not find post template.");
        }
        let element = template.cloneNode(true);
        element.removeAttribute('id');
        return element;
    }

    render() {
        if (!this.element) {
            this.element = this.getTemplate();

            this.element.dataset.id = this.id;
            this.element.querySelector('.item-img').src = this.image;
            this.element.querySelector('.title').innerHTML = this.title;
            this.element.querySelector('.description').innerHTML = this.description;
            this.element.querySelector('.creationDate').innerHTML = new Date(this.createdAt).toLocaleDateString() + '  ' + new Date(this.createdAt).toLocaleTimeString();
            for (let i = 0; i < this.tags.length; i++) {
                let tag = document.createElement('div');
                tag.dataset.tag = this.tags[i];
                tag.innerHTML = this.tags[i];
                this.element.querySelector('.tags').appendChild(tag);
            }
            this.element.querySelector('.delete').addEventListener('click', (event) => {event.target.parentElement.parentElement.remove()});
        }

        document.querySelector('.newsFeed').appendChild(this.element);
    }
}

const getData = () => {
    fetch('https://api.myjson.com/bins/152f9j', {
        method: 'GET',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then(response => { response.json().then(data => {
            console.log(data);
            sortedData = sortByTagsAndDate(data.data);
            renderPosts(sortedData, 0, 10);
        });
        })
        .catch(error => {
            console.error(`Problem with fetching the data. ${error}`);
        });
}

const checkSavedTags = () => {
    return (localStorage.getItem('tags'))?true:false;
}

const sortByDate = (a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
}

const sortByTagsAndDate = (data) => {
    let withoutMatchedTags = [];
    let withMatchedTags = data.filter((post) => {
        let result = true;
        for(let i = 0; i < localStorage.getItem('tags').split(',').length; i++){
            if(post.tags.indexOf(localStorage.getItem('tags').split(',')[i]) < 0){
                withoutMatchedTags.push(post);
                result = false;
                break;
            }
        }
        return result;
    });
    withMatchedTags.sort(sortByDate);
    withoutMatchedTags.sort(sortByDate);

    return withMatchedTags.concat(withoutMatchedTags);
}

const renderPosts = (data, start, count) => {
    for(let i = start; i < count; i++){
        let element = new Post(data[i]);
        element.render();
    }
}

const tagsHandler = (event) => {
    if(event.target.hasAttribute('data-tag')){
        event.target.classList.toggle("selected");
    }else if(event.target.getAttribute('id') == 'saveTags') {
        let tags = [];
        tagBlock.querySelectorAll('.selected').forEach((item, index, arr) => {
            tags.push(item.innerHTML);
        });
        localStorage.setItem('tags', tags);
        tagBlock.style.display = 'none';
        getData();
    }
}

const scrollHandler = () => {
    let screenHeigth = window.innerHeight;
    let lastPostBottom = document.querySelector('.newsFeed').lastElementChild.getBoundingClientRect().bottom;
    let postsCount = document.querySelectorAll('.postItem').length - 1;
    let data = (document.getElementById('search').value)?searchData:sortedData;

    if (lastPostBottom <= screenHeigth && postsCount < data.length) {
        renderPosts(sortByTagsAndDate(data), postsCount, postsCount + 10);
    }
}

const search = (event) => {
    let newsFeed = document.querySelector('.newsFeed');
    let template = document.getElementById('template');
    let searchStr = event.target.value.toLowerCase();
    searchData = sortedData.filter(function(item){
        return item['title'].toLowerCase().includes(searchStr);
    });
    newsFeed.innerHTML = '';
    newsFeed.appendChild(template);
    renderPosts(searchData, 0, (searchData.length < 10)?searchData.length:10);
    console.log(searchData);
};


window.addEventListener('scroll', scrollHandler, false);
window.addEventListener('touchmove', scrollHandler, false);
window.addEventListener('mousewheel', scrollHandler, false);

window.onload = () => {
    document.getElementById("search").addEventListener('keyup', search);
    if(!checkSavedTags()){
        let tagBlock = document.getElementById('tagBlock');
        tagBlock.addEventListener('click', tagsHandler);
        tagBlock.style.display = 'flex';
    }else {
        getData();
    }
};