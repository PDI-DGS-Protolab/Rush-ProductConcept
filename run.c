#include <unistd.h>
#include <sys/types.h>
#include <errno.h>
#include <stdio.h>
#include <sys/wait.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <pthread.h>    /* POSIX Threads */
#include <time.h>
#include <sys/resource.h>
#include <math.h>

int num_reqs = 500; /* A global variable*/

void * request_function ();
void sleepMs(int milisec);
int getMemory();
void * getData ( void *ptr );
void collect_data ();
void termination ();

int testing = 1;
int requests = 0;
int responses = 0;

int data [5000];
int samples = 0;
int max = 0;

pthread_mutex_t mutexres;
pthread_t dataThread;
pthread_t * threads;

void sleepMs(int milisec){
    struct timespec req = {0};
    req.tv_sec = milisec / 1000;
    req.tv_nsec = (milisec % 1000) * 1000000L;

    nanosleep(&req, (struct timespec *)NULL);
}

int size;
char * server;
char * output;
FILE * pFile;
char * endpoint;

void * printHelp(){
 fprintf (stderr, "Help:\n%s\n%s\n%s\n%s\n%s\n",
    "-i : interval between requests in ms. Default 1000ms",
    "-H : host name with protocol. Default http://localhost:80/",
    "-p : payload size in bytes. Default 1000 bytes",
    "-o : output file to store results. Csv file ",
    "-n : number of requests. Default to 500",
    "-r : Rush host address");
}

int main(int argc, char *argv[])
{
    printf("Requests: %d. Responses: %d. Used space %d\n", requests, responses, getMemory());


    pthread_attr_t attr;
    int sleep = 1000;
    server = "http://localhost:80/";
    size = 1000;
    int c;

    while ((c = getopt (argc, argv, "i:p:H:o:n:h:r")) != -1)
       switch (c)
   {
     case 'i':
     sleep = atoi(optarg);
     break;
     case 'p':
     size = atoi(optarg);
     break;
     case 'n':
     num_reqs = atoi(optarg);
     case 'H':
     server = optarg;
     break;
     case 'o':
     output = optarg;
     break;
     case 'h' :
     printHelp();
     return 0;
     break;
     case 'r':
     endpoint = server;
     server = optarg;
     case '?':
     if (optopt == 'i' || optopt == 'p' || optopt == 'H')
         fprintf (stderr, "Option -%c requires an argument.\n", optopt);
     else
         printHelp();
     return 1;
     default:
     abort ();
 }

 printf("%d, %d, %s\n", sleep, size, server);

 int status;
 int i;

 signal(SIGINT, termination);

 pthread_mutex_init(&mutexres, NULL);
 pthread_attr_init(&attr);
 pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

 threads = malloc(sizeof(pthread_t) * num_reqs);

 pthread_create (&dataThread, NULL, (void *) getData, NULL);

 for(i = 0; i<num_reqs;i++){
    sleepMs(sleep);
    requests++;
    pthread_create (&threads[i], &attr, (void *) request_function, NULL);
 }

testing = 0;

pthread_attr_destroy(&attr);

pthread_mutex_destroy(&mutexres);

pthread_join(dataThread, NULL);
}


void * request_function (void * ptr){

  CURL *curl;
  CURLcode res;
  struct stat file_info;
  double speed_upload, total_time;

  char name [30];
  FILE * file;

  time_t result = time(NULL);
  sprintf(name, "%d.test", (int) result);
  file = fopen(name, "w");
  ftruncate(fileno(file), size *  1024);
  fclose(file);

      file = fopen(name, "r"); /* open file to upload */
  if(!file) {
    printf("FILE ES NULL\n");
    exit(1);
}

      /* to get the file size */
if(fstat(fileno(file), &file_info) != 0) {
    exit(1);
}

printf("Se hace peticion\n");

curl = curl_easy_init();
if(curl) {
    struct curl_slist *headers=NULL;
        /* upload to this place */
    curl_easy_setopt(curl, CURLOPT_URL, server);
        //curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:8000/");

    curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1);

        /* tell it to "upload" to the URL */
    curl_easy_setopt(curl, CURLOPT_UPLOAD, 1L);

        /* pointer to pass to our read function */
    curl_easy_setopt(curl, CURLOPT_READDATA, file);

    curl_easy_setopt(curl, CURLOPT_INFILESIZE_LARGE,
     (curl_off_t)file_info.st_size);

    if (endpoint != NULL) {
      char header[100];
      strcpy(header, "x-relayer-host: ");
      strcat(header, endpoint);
      headers = curl_slist_append(headers, header);

      /* pass our list of custom made headers */
      curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    }


        /* enable verbose for easier tracing */
        //curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);

    res = curl_easy_perform(curl);
        /* Check for errors */
    if(res != CURLE_OK) {
      fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));

  }
  else {
          /* now extract transfer info */
      curl_easy_getinfo(curl, CURLINFO_SPEED_UPLOAD, &speed_upload);
      curl_easy_getinfo(curl, CURLINFO_TOTAL_TIME, &total_time);

          //fprintf(stderr, "Speed: %.3f bytes/sec during %.3f seconds\n",speed_upload, total_time);
  }
        /* always cleanup */
  if (headers != NULL) {
      curl_slist_free_all(headers); /* free the header list */
  }
  curl_easy_cleanup(curl);

  fclose(file);
  unlink(name);

  pthread_mutex_lock (&mutexres);
  responses++;
  pthread_mutex_unlock (&mutexres);

}
}


int getMemory () {
  int pid = getpid();
  char path[128] = "/proc/";
  sprintf(path + strlen(path), "%d", pid);
  sprintf(path + strlen(path), "/status");

  FILE *fp;
  fp = fopen(path,"r");
  char buf[256];
  int cont = 0;
  while (fgets (buf, sizeof(buf), fp)) {
    cont ++;
    if (cont == 16) {
      break;
    }
  }

    char* token;
    char* string;
    string = strdup(buf);
    token = strsep(&string, "\t");
    int res = (int) strtol(string, (char **)NULL, 10);
    return res;
}

void collect_data () {
    double media, varianza, desviacion;
    int i;

    for (i = 0; i < samples; i++)
    {
      media += ((double)data[i])/samples;
    }

    for (i = 0; i < samples; i++)
    {
      varianza += pow(((double)data[i] - media), 2)/samples;
    }

    desviacion = sqrt(varianza);

    printf("Media: %.2f\n", media);
    printf("Desviacion estándar: %.2f\n", desviacion);
    printf("Máximo: %d\n", max);

    if(output!=NULL) fclose(pFile);
}


void termination(){

    int i;

    collect_data();
    pthread_kill(dataThread, SIGKILL);

    exit(0);
}


void * getData (void * ptr){

    if (output != NULL) pFile = fopen(output, "w+");

    while(testing || responses != requests)
    {
        sleep(2);
        int memory = getMemory();
        printf("Requests: %d. Responses: %d. Used space %d\n", requests, responses, memory);
        if (output != NULL) fprintf(pFile, "%d, %d, %d\n", requests, responses, memory);
        data[samples] = memory;
        max = (memory > max) ? memory : max;
        samples++;
    }

    collect_data();

    pthread_exit(0); /* exit */
}


