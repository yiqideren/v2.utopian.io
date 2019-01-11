import API from 'src/plugins/api'

export const getFeaturedProjects = async (context) => {
  const payload = await API.call({
    context,
    method: 'get',
    url: '/v1/projects/featured'
  })
  context.commit('setFeaturedProjects', payload)
}

export const isNameAvailable = async (context, data) =>
  API.call({
    context,
    method: 'post',
    url: `/v1/projects/isnameavailable`,
    data
  })

export const saveProject = async (context, data) =>
  API.call({
    context,
    method: 'post',
    url: '/v1/project',
    data
  })

export const updateProject = async (context, project) => {
  const { _id, ...data } = project
  return API.call({
    context,
    method: 'post',
    url: `/v1/project/${_id}`,
    data
  })
}

export const fetchProject = async (context, { owner, slug }) =>
  API.call({
    context,
    method: 'get',
    url: `/v1/project/${owner}/${slug}`
  })

export const loadProject = async (context, { owner, slug, tab = 'details' }) => {
  const payload = await API.call({
    context,
    method: 'get',
    url: `/v1/project/${owner}/${slug}/${tab}`
  })
  context.commit('setProject', payload)
}

export const searchProjects = async (context, term) =>
  API.call({
    context,
    method: 'post',
    url: '/v1/projects/search',
    data: { term }
  })

export const hasRole = async (context, data) =>
  API.call({
    context,
    method: 'post',
    url: '/v1/projects/hasrole',
    data
  })
